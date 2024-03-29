import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { VPCStack } from "./vpc-stack";
import * as cdk from 'aws-cdk-lib';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';

export class DatabaseStack extends Stack {

    private readonly postgresqlRDSConnectLambda: lambda.Function;
    private readonly rdsCredentialSecret: sm.Secret;
    private readonly rdsInstanceName: string;
    private readonly proxy: rds.DatabaseProxy;
    private readonly vpcSecurityGroup: ec2.SecurityGroup;
    private readonly dbPort: number;

    constructor(scope: App, id: string, vpcStack: VPCStack, props?: StackProps) {
        super(scope, id, props);

        this.rdsInstanceName = "balancetest_postgresql_instance";
        const postgresqlRDSConnectLambdaName = "BalanceTest-postgresql-RDS-connect";
        const postgresqlRDSConnectLambdaFileName = "postgresql-rds-connect";
        const postgresqlRDSConnectLambdaRoleName = "BalanceTest-postgresqlRDSConnectLambda-Role";
        const postgresqlRDSConnectLambdaLogGroupName = "BalanceTest-postgresqlRDSConnect-Logs";
        this.dbPort = 5432;
        const rdsMonitoringRoleName = 'balancetest-rds-monitoring-role';

        const port = ec2.Port.tcp(this.dbPort);


        this.vpcSecurityGroup = new ec2.SecurityGroup(this, 'vpcSecurityGroup', {
            vpc: vpcStack.vpc,
            description: 'allow traffic from this security group and rds proxy',
        })

        this.vpcSecurityGroup.addIngressRule(
            ec2.Peer.ipv4(vpcStack.cidrStr),
            port,
            'allow traffic from within vpc'
        )

        // const rdsSecurityGroup = new ec2.SecurityGroup(this, 'rdsSecurityGroup', {
        //     vpc: vpcStack.vpc,
        //     description: 'allow traffic from lambda and proxy',
        // })

        // const proxySecurityGroup = new ec2.SecurityGroup(this, 'proxySecurityGroup', {
        //     vpc: vpcStack.vpc,
        //     description: 'allow traffic from rds and lambda',
        // })

        // const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'lambdaSecurityGroup', {
        //     vpc: vpcStack.vpc,
        //     description: 'allow traffic from rds and proxy',
        // })

        // rdsSecurityGroup.addIngressRule(
        //     ec2.Peer.securityGroupId(proxySecurityGroup.securityGroupId), 
        //     port, 
        //     'allow traffic from proxy', 
        // )

        // rdsSecurityGroup.addIngressRule(
        //     ec2.Peer.securityGroupId(lambdaSecurityGroup.securityGroupId), 
        //     port, 
        //     'allow traffic from lambda', 
        // )

        // proxySecurityGroup.addIngressRule(
        //     ec2.Peer.securityGroupId(rdsSecurityGroup.securityGroupId), 
        //     port, 
        //     'allow traffic from rds', 
        // )

        // proxySecurityGroup.addIngressRule(
        //     ec2.Peer.securityGroupId(lambdaSecurityGroup.securityGroupId), 
        //     port, 
        //     'allow traffic from lambda', 
        // )

        // lambdaSecurityGroup.addIngressRule(
        //     ec2.Peer.securityGroupId(rdsSecurityGroup.securityGroupId), 
        //     port, 
        //     'allow traffic from rds', 
        // )

        // lambdaSecurityGroup.addIngressRule(
        //     ec2.Peer.securityGroupId(proxySecurityGroup.securityGroupId), 
        //     port, 
        //     'allow traffic from proxy', 
        // )


        // rdsLambdaSecurityGroup.addIngressRule(
        //     ec2.Peer.securityGroupId(proxySecurityGroup.securityGroupId), 
        //     port, 
        //     'allow traffic from rds proxy', 
        // )

        // database secret
        this.rdsCredentialSecret = new sm.Secret(this, 'Secret', {
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: 'postgres' }),
                generateStringKey: 'password',
                excludeCharacters: '"@/\\'
            }
        })

        const monitoringRole = new iam.Role(this, 'RdsMonitoringRole', {
            assumedBy: new iam.ServicePrincipal("monitoring.rds.amazonaws.com"),
            roleName: rdsMonitoringRoleName,
            description: 'Allows RDS to manage CloudWatch Logs resources for Enhanced Monitoring',
            managedPolicies: [iam.ManagedPolicy.fromManagedPolicyArn(this, 'rds-monitoring-role', 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole')]
        })

        // make multi-AZ RDS instance 
        const rdsInstance = new rds.DatabaseInstance(this, this.rdsInstanceName, {
            engine: rds.DatabaseInstanceEngine.POSTGRES,
            databaseName: this.rdsInstanceName,
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
                username: this.rdsCredentialSecret.secretValueFromJson('username').unsafeUnwrap(),
                password: this.rdsCredentialSecret.secretValueFromJson('password')
            },
            removalPolicy: RemovalPolicy.RETAIN,
            monitoringInterval: cdk.Duration.seconds(60),
            monitoringRole: monitoringRole,
            securityGroups: [this.vpcSecurityGroup]
            // securityGroups: [ec2.SecurityGroup.fromSecurityGroupId(this, 'VPCDefaultSecurityGroup', vpcStack.vpc.vpcDefaultSecurityGroup)],
        })

        this.proxy = new rds.DatabaseProxy(this, 'Proxy', {
            proxyTarget: rds.ProxyTarget.fromInstance(rdsInstance),
            secrets: [this.rdsCredentialSecret],
            vpc: vpcStack.vpc,
            securityGroups: [this.vpcSecurityGroup],
            // securityGroups: [ec2.SecurityGroup.fromSecurityGroupId(this, 'VpcDefaultSecurityGroup', vpcStack.vpc.vpcDefaultSecurityGroup)],
            requireTLS: false
        });

        const dbProxyRole = new iam.Role(this, 'DBProxyRole', { assumedBy: new iam.AccountPrincipal(this.account) });
        this.proxy.grantConnect(dbProxyRole, 'admin'); // Grant the role connection access to the DB Proxy for database user 'admin'.
        
        // const port = ec2.Port.tcp(this.dbPort);
        // rdsInstance.connections.securityGroups.forEach((securityGroup) => {
        //     securityGroup.addIngressRule(ec2.Peer.ipv4(vpcStack.cidrStr), port, "BalanceTest-RDS-Postgres-Ingress")
        // });

        // make log group for Lambda that connects to PostgreSQL RDS
        const postgresqlRDSConnectLambdaLogGroup = new logs.LogGroup(this, postgresqlRDSConnectLambdaLogGroupName, {
            logGroupName: `/aws/lambda/${postgresqlRDSConnectLambdaName}`
          });


        // make IAM role for Lambda that generates a report
        const postgresqlRDSConnectLambdaPolicyDocument = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                actions: [
                    "logs:CreateLogStream",
                    "logs:CreateLogGroup",
                    "logs:PutLogEvents",
                ],
                resources: [postgresqlRDSConnectLambdaLogGroup.logGroupArn],
                }),
                new iam.PolicyStatement({
                actions: [
                    "secretsmanager:GetSecretValue"
                ],
                resources:[this.rdsCredentialSecret.secretArn]
                // resources:[`arn:aws:secretsmanager:${this.region}:${this.account}:secret:postgresql-credentials-??????`]
                }),
            ],
        });
        const postgresqlRDSConnectLambdaRole = new iam.Role(this, postgresqlRDSConnectLambdaRoleName, {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            roleName: postgresqlRDSConnectLambdaRoleName,
            description: "Role gives access to appropriate S3 functions needed for doing S3 Select for Lambda.",
            inlinePolicies: { ["BalanceTest-postgresqlRDSConnectLambdaPolicy"]: postgresqlRDSConnectLambdaPolicyDocument },
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess")]
        });
        
        const postgresqlRDSConnectLambdaRuntime = lambda.Runtime.NODEJS_14_X;
        const postgresqlRDSConnectLambdaLayer = new lambda.LayerVersion(this, "postgresqlRDSConnectLayer", {
            code: lambda.Code.fromAsset('layers/postgresqlRDSConnectNodePackages.zip'),
            compatibleRuntimes: [postgresqlRDSConnectLambdaRuntime],
            removalPolicy: RemovalPolicy.DESTROY,
            description: "Contains libraries for the " + postgresqlRDSConnectLambdaName + " function."
        });
        
        
        // make Lambda to generate a PDF report for downloading in dashboard
        this.postgresqlRDSConnectLambda = new lambda.Function(this, postgresqlRDSConnectLambdaName, {
            runtime: postgresqlRDSConnectLambdaRuntime,
            functionName: postgresqlRDSConnectLambdaName,
            handler: postgresqlRDSConnectLambdaFileName + ".handler",
            code: lambda.Code.fromAsset("./lambda/" + postgresqlRDSConnectLambdaFileName),
            timeout: Duration.seconds(30),
            memorySize: 512,
            role: postgresqlRDSConnectLambdaRole,
            environment: {
                "PGDATABASE": this.getDatabaseName(),
                "PGHOST": this.getDatabaseProxyEndpoint(),
                "PGPORT": String(this.dbPort),
                'PG_SECRET_NAME': this.getDatabaseSecretName()
            },
            layers: [postgresqlRDSConnectLambdaLayer],
            vpc: vpcStack.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            },
            securityGroups: [ec2.SecurityGroup.fromSecurityGroupId(this, 'vpcDefaultSecurityGroup', vpcStack.vpc.vpcDefaultSecurityGroup)]
        });
    }

    public getPostgresqlRDSConnectLambda(): lambda.Function {
        return this.postgresqlRDSConnectLambda;
    }

    public getDatabaseSecretName(): string {
        return this.rdsCredentialSecret.secretName;
    }

    public getDatabaseSecretArn(): string {
        return this.rdsCredentialSecret.secretArn;
    }

    public getDatabaseName(): string {
        return this.rdsInstanceName;
    }

    public getDatabaseProxyEndpoint(): string {
        return this.proxy.endpoint; 
    }
    
    public getDatabaseSecurityGroup(): ec2.SecurityGroup {
        return this.vpcSecurityGroup;
    }

    public getDatabasePort(): string {
        return String(this.dbPort);
    }

}