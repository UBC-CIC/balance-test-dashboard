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

    private readonly secretRdsPath: string;
    private readonly postgresqlRDSConnectLambda: lambda.Function;

    constructor(scope: App, id: string, vpcStack: VPCStack, props?: StackProps) {
        super(scope, id, props);

        const rdsInstanceName = "balancetest-postgresql-instance";
        const postgresqlRDSConnectLambdaName = "BalanceTest-postgresql-RDS-connect";
        const postgresqlRDSConnectLambdaFileName = "postgresql-rds-connect";
        const postgresqlRDSConnectLambdaRoleName = "BalanceTest-postgresqlRDSConnectLambda-Role";
        const postgresqlRDSConnectLambdaLogGroupName = "BalanceTest-postgresqlRDSConnect-Logs";

        // database secret; make secret during deployment
        this.secretRdsPath = 'balanceTest/credentials/rdsCredentials';
        const rdsUsername = sm.Secret.fromSecretNameV2(this, 'balanceTest-rdsUsername', 'balanceTest-rdsUsername');
        
        // make single-AZ RDS instance 
        const rdsInstance = new rds.DatabaseInstance(this, rdsInstanceName, {
            engine: rds.DatabaseInstanceEngine.POSTGRES,
            databaseName: rdsInstanceName,
            multiAz: false,
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
            credentials: rds.Credentials.fromUsername(rdsUsername.secretValueFromJson("username").toString(), {
                secretName: this.secretRdsPath
            }), //TODO: instead of toString(), may want to use unsafeUnwrap(); test by deploying
            removalPolicy: RemovalPolicy.RETAIN,
        })
        //TODO: see if I need rds credentials in props, and test if secrets manager is enough

        //TODO: check if we need this
        rdsInstance.connections.securityGroups.forEach((securityGroup) => {
            securityGroup.addIngressRule(ec2.Peer.ipv4(vpcStack.cidrStr), ec2.Port.tcp(5432), "BalanceTest-RDS-Postgres-Ingress")
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

        //TODO: add python layers for this lambda, and figure out what is needed to connect to the lambda (appsync resolver)
        // make Lambda to generate a PDF report for downloading in dashboard
        this.postgresqlRDSConnectLambda = new lambda.Function(this, postgresqlRDSConnectLambdaName, {
            runtime: lambda.Runtime.PYTHON_3_7,
            functionName: postgresqlRDSConnectLambdaName,
            handler: postgresqlRDSConnectLambdaFileName + ".lambda_handler",
            code: lambda.Code.fromAsset("./lambda/" + postgresqlRDSConnectLambdaFileName),
            timeout: Duration.minutes(3),
            memorySize: 512,
            role: postgresqlRDSConnectLambdaRole,
            // layers: [],
            //vpc: vpcStack.vpc,
        });
    }

    public getPostgresqlRDSConnectLambda(): lambda.Function {
        return this.postgresqlRDSConnectLambda;
    }
}