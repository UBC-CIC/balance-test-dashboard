import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { VPCStack } from "./vpc-stack";
import * as cdk from 'aws-cdk-lib';

export class DatabaseStack extends Stack {

    private readonly postgresqlRDSConnectLambda: lambda.Function;

    constructor(scope: App, id: string, vpcStack: VPCStack, props?: StackProps) {
        super(scope, id, props);

        const rdsInstanceName = "balancetest-postgresql-instance";
        const postgresqlRDSConnectLambdaName = "BalanceTest-postgresql-RDS-connect";
        const postgresqlRDSConnectLambdaFileName = "postgresql-rds-connect";
        const postgresqlRDSConnectLambdaRoleName = "BalanceTest-postgresqlRDSConnectLambda-Role";
        const postgresqlRDSConnectLambdaLogGroupName = "BalanceTest-postgresqlRDSConnect-Logs";

        // database secret
        const rdsCredentialSecret = new sm.Secret(this, 'Secret', {
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: 'postgres' }),
                generateStringKey: 'password',
            }
        })

        //TODO: double this configuration
        // make single-AZ RDS instance 
        const rdsInstance = new rds.DatabaseInstance(this, rdsInstanceName, {
            engine: rds.DatabaseInstanceEngine.POSTGRES,
            databaseName: rdsInstanceName,
            multiAz: true,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            storageType: rds.StorageType.GP2,
            storageEncrypted: true,
            allocatedStorage: 400,
            autoMinorVersionUpgrade: true,
            allowMajorVersionUpgrade: false,
            publiclyAccessible: false,
            backupRetention: cdk.Duration.days(30),
            deleteAutomatedBackups: false,
            deletionProtection: true,
            vpc: vpcStack.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            },
            credentials: {
                username: rdsCredentialSecret.secretValueFromJson('username').unsafeUnwrap(),
                password: rdsCredentialSecret.secretValueFromJson('password')
            },
            removalPolicy: RemovalPolicy.RETAIN,
        })
        
        //TODO: check if we need this
        const port = ec2.Port.tcp(5432);
        rdsInstance.connections.securityGroups.forEach((securityGroup) => {
            securityGroup.addIngressRule(ec2.Peer.ipv4(vpcStack.cidrStr), port, "BalanceTest-RDS-Postgres-Ingress")
        });

        // make log group for Lambda that connects to PostgreSQL RDS
        const postgresqlRDSConnectLambdaLogGroup = new logs.LogGroup(this, postgresqlRDSConnectLambdaLogGroupName, {
            logGroupName: `/aws/lambda/${postgresqlRDSConnectLambdaName}`,
            removalPolicy: RemovalPolicy.DESTROY
          });

        //TODO: change permissions to restrictive ones, and remove managed policies
        // make IAM role for Lambda that generates a report
        const postgresqlRDSConnectLambdaPolicyDocument = new iam.PolicyDocument({
            statements: [new iam.PolicyStatement({
            actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
            resources: [postgresqlRDSConnectLambdaLogGroup.logGroupArn]
            })]
        });
        const postgresqlRDSConnectLambdaRole = new iam.Role(this, postgresqlRDSConnectLambdaRoleName, {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            roleName: postgresqlRDSConnectLambdaRoleName,
            description: "Role gives access to appropriate S3 functions needed for doing S3 Select for Lambda.",
            inlinePolicies: { ["BalanceTest-postgresqlRDSConnectLambdaPolicy"]: postgresqlRDSConnectLambdaPolicyDocument },
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess")]
        });
        
        //TODO: test the layer, and figure out what is needed to connect to the lambda (appsync resolver)
        const postgresqlRDSConnectLambdaRuntime = lambda.Runtime.NODEJS_16_X;
        const postgresqlRDSConnectLambdaLayer = new lambda.LayerVersion(this, "postgresqlRDSConnectLayer", {
            code: lambda.Code.fromAsset('layers/postgresqlRDSConnectNodePackages'),
            compatibleRuntimes: [postgresqlRDSConnectLambdaRuntime],
            removalPolicy: RemovalPolicy.DESTROY,
            description: "Contains libraries for the " + postgresqlRDSConnectLambdaName + " function."
        });
        
        //TODO: check environment variables; use parameter store to get the values for environment variables if needed
        // make Lambda to generate a PDF report for downloading in dashboard
        this.postgresqlRDSConnectLambda = new lambda.Function(this, postgresqlRDSConnectLambdaName, {
            runtime: postgresqlRDSConnectLambdaRuntime,
            functionName: postgresqlRDSConnectLambdaName,
            handler: postgresqlRDSConnectLambdaFileName + ".lambda_handler",
            code: lambda.Code.fromAsset("./lambda/" + postgresqlRDSConnectLambdaFileName),
            timeout: Duration.minutes(3),
            memorySize: 512,
            role: postgresqlRDSConnectLambdaRole,
            // environment: {
            //     "PGDATABASE": rdsInstanceName,
            //     "PGHOST": ,
            //     "PGUSER": rdsCredentialSecret.secretValueFromJson('username').unsafeUnwrap(),
            //     "PGPASSWORD": rdsCredentialSecret.secretValueFromJson('password'),
            //     "PGPORT": port,
            // },
            layers: [postgresqlRDSConnectLambdaLayer],
            //vpc: vpcStack.vpc,
        });
    }

    public getPostgresqlRDSConnectLambda(): lambda.Function {
        return this.postgresqlRDSConnectLambda;
    }
}