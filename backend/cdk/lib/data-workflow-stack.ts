import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3notif from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from 'aws-cdk-lib';
import { VPCStack } from './vpc-stack';
import { CognitoStack } from './cognito-stack';
import { DatabaseStack } from './database-stack';

export const balanceTestBucketName = 'balancetest-datastorage-bucket'
export class DataWorkflowStack extends Stack {

    private readonly balanceTestBucket: s3.Bucket;
    private readonly generateReportLambda: lambda.Function;
    private readonly deleteS3RecordLambda: lambda.Function;
    private readonly endpointName: string;
    private readonly s3LambdaTriggerSagemakerRole: iam.Role;
    private readonly savedModelsS3Key: string;

    constructor(scope: App, id: string, vpcStack: VPCStack, cognitoStack: CognitoStack, databaseStack: DatabaseStack, props: StackProps) {
      super(scope, id, props);
      
      // const balanceTestBucketName = 'balancetest-datastorage-bucket'
      const balanceTestBucketAccessPointName = "balancetest-accesspt";

      //**MUST** have "sagemaker" as the **FIRST** word of the Sagemaker bucket name for training job output purposes
      const sagemakerBucketName ='sagemaker-balancetest-bucket';
      const sagemakerBucketAccessPointName = 'balancetest-sm-accesspt';

      const s3LambdaTriggerName = "BalanceTest-data-workflow"
      const s3LambdaTriggerFolderName = "data-workflow-s3-lambda-trigger-image"
      const s3LambdaTriggerRoleName = "BalanceTest-S3LambdaTrigger-Role";
      const s3LambdaTriggerSagemakerRoleName = "BalanceTest-Sagemaker-Execution-Role"

      const logGroupName = "BalanceTest-S3LambdaTrigger-Logs";
      const sagemakerLogGroupName = "BalanceTest-SagemakerExecution-Logs";
      const endpointNameParameterName = "BalanceTest-Model-Endpoint-Param"; 
      this.endpointName = "balance-test-multimodel";
      this.savedModelsS3Key = "saved_models";

      const securityGroupParameterName = "BalanceTest-VPC-DefaultSecurityGroupID";
      const privateSubnet1ParameterName = "BalanceTest-VPC-PrivateSubnet1ID";
      const privateSubnet2ParameterName = "BalanceTest-VPC-PrivateSubnet2ID";

      const generateReportLambdaName = "BalanceTest-generate-report-for-download";
      const generateReportLambdaFileName = "generateReportForDownload";
      const generateReportLambdaRoleName = "BalanceTest-generateReportLambda-Role";
      const generateReportLambdaLogGroupName = "BalanceTest-generateReportLambda-Logs";

      const deleteS3RecordLambdaName = "BalanceTest-delete-s3-record";
      const deleteS3RecordLambdaFileName = "delete-s3-record";
      const deleteS3RecordLambdaRoleName = "BalanceTest-deleteS3RecordLambda-Role";
      const deleteS3RecordLambdaLogGroupName = "BalanceTest-deleteS3RecordLambda-Logs";

      let region;
      if (props["env"] && props["env"]["region"]) {
        region = props["env"]["region"]
      }

      let account = '';
      if (props["env"] && props["env"]["account"]) {
        account = props["env"]["account"]
      }

      //must ensure that this is a PRIVATE/BLOCK_ALL public access bucket!
      this.balanceTestBucket = new s3.Bucket(this, balanceTestBucketName, {
        bucketName: balanceTestBucketName,
        removalPolicy: RemovalPolicy.RETAIN,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        publicReadAccess: false,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED
      }); 

      // add an access point for VPC
      const balanceTestBucketAccessPoint = new s3.CfnAccessPoint(this, balanceTestBucketAccessPointName, {
        bucket: this.balanceTestBucket.bucketName,
        bucketAccountId: props?.env?.account,
        name: balanceTestBucketAccessPointName,
        publicAccessBlockConfiguration: {
          blockPublicAcls: true,
          blockPublicPolicy: true,
          restrictPublicBuckets: true,
          ignorePublicAcls: true,
        },
        vpcConfiguration: {
          vpcId: vpcStack.vpc.vpcId,
        }
      });

      const sagemakerBucket = new s3.Bucket(this, sagemakerBucketName, {
        bucketName: sagemakerBucketName,
        removalPolicy: RemovalPolicy.RETAIN,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        publicReadAccess: false,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED
      });

      // add an access point for VPC
      const sagemakerBucketAccessPoint = new s3.CfnAccessPoint(this, sagemakerBucketAccessPointName, {
        bucket: sagemakerBucket.bucketName,
        bucketAccountId: props?.env?.account,
        name: sagemakerBucketAccessPointName,
        publicAccessBlockConfiguration: {
          blockPublicAcls: true,
          blockPublicPolicy: true,
          restrictPublicBuckets: true,
          ignorePublicAcls: true,
        },
        vpcConfiguration: {
          vpcId: vpcStack.vpc.vpcId,
        }
      });

      let securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'vpcDefaultSecurityGroup', vpcStack.vpc.vpcDefaultSecurityGroup);

      //make parameters for private subnets and default security group to be used for VPC configuration
      const securityGroupParameter = new ssm.StringParameter(this, securityGroupParameterName, {
        parameterName: securityGroupParameterName,
        stringValue: securityGroup.securityGroupId,
      });

      const privateSubnet1Parameter = new ssm.StringParameter(this, privateSubnet1ParameterName, {
        parameterName: privateSubnet1ParameterName,
        stringValue: vpcStack.vpc.isolatedSubnets[0].subnetId,
      });

      const privateSubnet2Parameter = new ssm.StringParameter(this, privateSubnet2ParameterName, {
        parameterName: privateSubnet2ParameterName,
        stringValue: vpcStack.vpc.isolatedSubnets[1].subnetId,
      });

      // endpointNameParameter.applyRemovalPolicy(RemovalPolicy.DESTROY);
      securityGroupParameter.applyRemovalPolicy(RemovalPolicy.DESTROY);
      privateSubnet1Parameter.applyRemovalPolicy(RemovalPolicy.DESTROY);
      privateSubnet2Parameter.applyRemovalPolicy(RemovalPolicy.DESTROY);
      
      // create log groups
      const logGroup = new logs.LogGroup(this, logGroupName, {
        logGroupName: `/aws/lambda/${s3LambdaTriggerName}`,
        removalPolicy: RemovalPolicy.DESTROY
      });

      const sagemakerLogGroup = new logs.LogGroup(this, sagemakerLogGroupName, {
        logGroupName: `/aws/sagemaker/${sagemakerLogGroupName}`,
        removalPolicy: RemovalPolicy.DESTROY
      });

      //create policy document and role for Lambda trigger and Sagemaker training job
      const s3LambdaTriggerSagemakerPolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          actions: ["s3:GetObject", "s3:PutObject", "s3:ListBucket", "s3:GetObjectTagging", "s3:PutObjectTagging"],
          resources: [this.balanceTestBucket.bucketArn + "/*", sagemakerBucket.bucketArn + "/*"]

        }), new iam.PolicyStatement({
          actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
          resources: [sagemakerLogGroup.logGroupArn]

        })],
      });

      this.s3LambdaTriggerSagemakerRole = new iam.Role(this, s3LambdaTriggerSagemakerRoleName, {
        assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
        roleName: s3LambdaTriggerSagemakerRoleName,
        description: "Role gives access for executing Sagemaker functions.",
        inlinePolicies: { ["BalanceTest-SagemakerExecutionPolicy"]: s3LambdaTriggerSagemakerPolicyDocument },
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess")]
      });

      const s3LambdaTriggerPolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
            actions: ["s3:PutObject"],
            resources: [this.balanceTestBucket.bucketArn + "/parquet_data/*"]
  
        }), new iam.PolicyStatement({ 
            actions: ["s3:ListBucket"],
            resources: [this.balanceTestBucket.bucketArn + "/private/*", this.balanceTestBucket.bucketArn, sagemakerBucket.bucketArn, sagemakerBucket.bucketArn + "/*"]

        }), new iam.PolicyStatement({
            actions: ["s3:GetObject"],
            resources: [this.balanceTestBucket.bucketArn + "/private/*"]

        }), new iam.PolicyStatement({
            actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents", "logs:DescribeLogStreams", "logs:GetLogEvents"],
            resources: [logGroup.logGroupArn, `arn:aws:logs:${region}:${account}:log-group:/aws/sagemaker/*`]

        }), new iam.PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            resources: [databaseStack.getDatabaseSecretArn()]
            
        }), new iam.PolicyStatement({
            actions: ["ssm:DescribeParameters", "ssm:GetParameter", "ssm:GetParameters", "ssm:PutParameter"],
            resources: ["*"]

        }), new iam.PolicyStatement({
            actions: ["sagemaker:InvokeEndpoint"],
            resources: [`arn:aws:sagemaker:${region}:${account}:endpoint/${this.endpointName}`]

        }), new iam.PolicyStatement({
          actions: ["s3:GetObject", "s3:PutObject", "s3:GetObjectTagging", "s3:PutObjectTagging"],
          resources: [sagemakerBucket.bucketArn + "/*", this.balanceTestBucket.bucketArn + "/*"] 

        }), new iam.PolicyStatement({
          actions: ["sagemaker:CreateTrainingJob", "sagemaker:DescribeTrainingJob", "sagemaker:CreateModel", "sagemaker:CreateEndpointConfig", 
                    "sagemaker:CreateEndpoint", "sagemaker:DescribeEndpoint", "sagemaker:DescribeEndpointConfig", "sagemaker:AddTags", "sagemaker:ListEndpoints"],
          resources: ["*"]

        }), new iam.PolicyStatement({
          actions: ["iam:PassRole"],
          resources: [this.s3LambdaTriggerSagemakerRole.roleArn]

        })]
      });
      
      const s3LambdaTriggerRole = new iam.Role(this, s3LambdaTriggerRoleName, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        roleName: s3LambdaTriggerRoleName,
        description: "Role gives access to appropriate functions needed for file conversions, logging, calling Sagemaker functions, and calling S3 functions for Lambda.",
        inlinePolicies: { ["BalanceTest-s3LambdaTriggerPolicy"]: s3LambdaTriggerPolicyDocument },
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")]
      });

      // make Lambda Trigger
      const s3LambdaTrigger = new lambda.DockerImageFunction(this, s3LambdaTriggerName, {
        code: lambda.DockerImageCode.fromImageAsset("./lambda/" + s3LambdaTriggerFolderName),
        allowPublicSubnet: false,
        environment: {
          endpoint_name: this.endpointName,
          dbname: databaseStack.getDatabaseName(),
          host: databaseStack.getDatabaseProxyEndpoint(),
          port: databaseStack.getDatabasePort(),
          rds_secret_name: databaseStack.getDatabaseSecretName(),
          sagemaker_bucket_name: sagemakerBucket.bucketName,
          sagemaker_execution_role: this.s3LambdaTriggerSagemakerRole.roleArn,
          security_group_parameter_name: securityGroupParameterName,
          private_subnet_1_parameter_name: privateSubnet1ParameterName,
          private_subnet_2_parameter_name: privateSubnet2ParameterName,
          saved_models_s3_key: this.savedModelsS3Key
        },
        functionName: s3LambdaTriggerName,
        memorySize: 512, //a lower size would not be able to run the whole code
        role: s3LambdaTriggerRole,
        timeout: Duration.minutes(10), //increase to 15 min (maximum) if needed
        retryAttempts: 0, 
        vpc: vpcStack.vpc,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        securityGroups: [securityGroup, databaseStack.getDatabaseSecurityGroup()],
      });

      // set Lambda trigger for the S3 bucket; ENSURE that the PREFIX and SUFFIX are set to private/ and .json, respectively, or to other subfolders you want
      this.balanceTestBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3notif.LambdaDestination(s3LambdaTrigger),
        {
          prefix: "private/",
          suffix: ".json"
        }
      );
      
      // make log group for Lambda that generates a report
      const generateReportLambdaLogGroup = new logs.LogGroup(this, generateReportLambdaLogGroupName, {
        logGroupName: `/aws/lambda/${generateReportLambdaName}`,
        removalPolicy: RemovalPolicy.DESTROY
      });

      // make IAM role for Lambda that generates a report
      const generateReportLambdaPolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
          resources: [generateReportLambdaLogGroup.logGroupArn]
        }),
        new iam.PolicyStatement({
              actions: [
                  "s3:PutObject",
                  "s3:GetObject",
                  "s3:DeleteObject"
              ],
              resources: ['arn:aws:s3:::'+balanceTestBucketName+'/*'],
            })]
      });
      const generateReportLambdaRole = new iam.Role(this, generateReportLambdaRoleName, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        roleName: generateReportLambdaRoleName,
        description: "Role gives access to appropriate S3 functions needed for doing S3 Select for Lambda.",
        inlinePolicies: { ["BalanceTest-generateReportLambdaPolicy"]: generateReportLambdaPolicyDocument },
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")]
      });

      const generateReportRuntime = lambda.Runtime.PYTHON_3_7;
      const generateReportLambdaLayer = new lambda.LayerVersion(this, "generateReportPythonLayer", {
        removalPolicy: RemovalPolicy.DESTROY,
        code: lambda.Code.fromAsset('layers/generateReportPythonPackages.zip'),
        compatibleRuntimes: [generateReportRuntime],
        description: "Contains libraries for the " + generateReportLambdaName + " function."
      })

      // make Lambda to generate a PDF report for downloading in dashboard
      this.generateReportLambda = new lambda.Function(this, generateReportLambdaName, {
        runtime: generateReportRuntime,
        functionName: generateReportLambdaName,
        handler: generateReportLambdaFileName + ".lambda_handler",
        code: lambda.Code.fromAsset("./lambda/" + generateReportLambdaFileName),
        timeout: Duration.minutes(3),
        memorySize: 512,
        role: generateReportLambdaRole,
        environment: {
          "S3_BUCKET_NAME": this.balanceTestBucket.bucketName
        },
        layers: [generateReportLambdaLayer],
        vpc: vpcStack.vpc,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        securityGroups: [securityGroup]
    
      });

      // make log group for Lambda that deletes files from S3
      const deleteS3RecordLambdaLogGroup = new logs.LogGroup(this, deleteS3RecordLambdaLogGroupName, {
        logGroupName: `/aws/lambda/${deleteS3RecordLambdaName}`,
        removalPolicy: RemovalPolicy.DESTROY
      });

      // make IAM role for Lambda that deletes files from S3
      const deleteS3RecordLambdaPolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
          resources: [deleteS3RecordLambdaLogGroup.logGroupArn]

        }), new iam.PolicyStatement({
          actions: ["s3:DeleteObject"],
          resources: [this.balanceTestBucket.bucketArn + "/*"]

        })]
      });
      const deleteS3RecordLambdaRole = new iam.Role(this, deleteS3RecordLambdaRoleName, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        roleName: deleteS3RecordLambdaRoleName,
        description: "Role gives access to appropriate S3 functions needed for Lambda.",
        inlinePolicies: { ["BalanceTest-deleteS3RecordLambdaPolicy"]: deleteS3RecordLambdaPolicyDocument },
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")]
      });

      const cognitoIdentityPoolId = ssm.StringParameter.fromStringParameterAttributes(this, "BalanceTestCognitoIdentityPoolId", {
        parameterName: "IdentityPoolId"
      }).stringValue;

      const cognitoUserPoolId = cognitoStack.UserPoolId;

      // make Lambda to delete a test event record from S3
      this.deleteS3RecordLambda = new lambda.Function(this, deleteS3RecordLambdaName, {
        runtime: lambda.Runtime.PYTHON_3_7,
        functionName: deleteS3RecordLambdaName,
        handler: deleteS3RecordLambdaFileName + ".lambda_handler",
        code: lambda.Code.fromAsset("./lambda/" + deleteS3RecordLambdaFileName),
        timeout: Duration.minutes(3),
        memorySize: 512,
        role: deleteS3RecordLambdaRole,
        environment: {
          "S3_BUCKET_NAME": this.balanceTestBucket.bucketName,
          "IDENTITY_POOL_ID": cognitoIdentityPoolId,
          "USER_POOL_ID": cognitoUserPoolId,
          "REGION": this.region,
        },
        vpc: vpcStack.vpc,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        securityGroups: [securityGroup]
      });
    }

    public getS3BucketName(): string {
      return this.balanceTestBucket.bucketName;
    }

    public getS3BucketArn(): string {
      return this.balanceTestBucket.bucketArn;
    }

    public getGenerateReportLambda(): lambda.Function {
      return this.generateReportLambda;
    }

    public getDeleteS3RecordLambda(): lambda.Function {
      return this.deleteS3RecordLambda;
    }
  }