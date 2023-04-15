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

    // private readonly balanceTestBucket: s3.Bucket;
    private readonly balanceTestBucket: s3.IBucket;
    private readonly generateReportLambda: lambda.Function;
    private readonly deleteS3RecordLambda: lambda.Function;

    constructor(scope: App, id: string, vpcStack: VPCStack, cognitoStack: CognitoStack, databaseStack: DatabaseStack, props: StackProps) {
    // constructor(scope: App, id: string, props: StackProps) {
      super(scope, id, props);
      
      // const balanceTestBucketName = 'balancetest-datastorage-bucket'
      const balanceTestBucketAccessPointName = "balancetest-accesspt";
      const sagemakerBucketName ='balancetest-sagemaker-bucket';
      const sagemakerBucketAccessPointName = 'balancetest-sm-access';

      // const s3LambdaTriggerName = "BalanceTest-convert-json-to-parquet-and-csv";
      // const s3LambdaTriggerFileName = "s3-trigger-convert-json-to-parquet-and-csv";
      const s3LambdaTriggerName = "BalanceTest-data-workflow"
      const s3LambdaTriggerFolderName = "data-workflow-s3-lambda-trigger-image"
      const logGroupName = "BalanceTest-S3LambdaTrigger-Logs";
      const s3LambdaTriggerRoleName = "BalanceTest-S3LambdaTrigger-Role";
      // const endpointName = "balance-test-multimodel-endpoint"; // TODO: uncomment this
      const endpointName = 'mme-balance-test';

      const generateReportLambdaName = "BalanceTest-generate-report-for-download";
      const generateReportLambdaFileName = "generateReportForDownload";
      const generateReportLambdaRoleName = "BalanceTest-generateReportLambda-Role";
      const generateReportLambdaLogGroupName = "BalanceTest-generateReportLambda-Logs";

      const deleteS3RecordLambdaName = "BalanceTest-delete-s3-record";
      const deleteS3RecordLambdaFileName = "delete-s3-record";
      const deleteS3RecordLambdaRoleName = "BalanceTest-deleteS3RecordLambda-Role";
      const deleteS3RecordLambdaLogGroupName = "BalanceTest-deleteS3RecordLambda-Logs";

      let region = 'ca-central-1';
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

      //TODO: change to secured StringParameter
      // const balanceTestBucketName = ssm.StringParameter.fromStringParameterAttributes(this, "BalanceTestRecordingsBucketArn", {
      //   parameterName: "S3BucketName"
      // }).stringValue;

      // get data storage bucket using bucket ARN
      // this.balanceTestBucket = s3.Bucket.fromBucketArn(this, "balancetestrecordings160420-dev", "arn:aws:s3:::" + balanceTestBucketName);

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


      // let balanceTestIVPC = ec2.Vpc.fromLookup(this, "BalanceTest-iVPC", {
      //   vpcId: vpcStack.vpc.vpcId
      // });

      // let vpcLambdaSubnetSelection = {
      //   subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      // };

      let securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'vpcDefaultSecurityGroup', vpcStack.vpc.vpcDefaultSecurityGroup);

      //TODO: see if we need to delete logs when destroying stacks, or retain
      // create log group
      const logGroup = new logs.LogGroup(this, logGroupName, {
        logGroupName: `/aws/lambda/${s3LambdaTriggerName}`,
        removalPolicy: RemovalPolicy.DESTROY
      });

      //create policy document and role for Lambda trigger
      // const s3LambdaTriggerPolicyDocument = new iam.PolicyDocument({
      //   statements: [new iam.PolicyStatement({
      //     actions: ["s3:GetObject"],
      //     resources: [this.balanceTestBucket.bucketArn + "/private/*"]

      //   }), new iam.PolicyStatement ({
      //     actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
      //     resources: [logGroup.logGroupArn]
          
      //   }), new iam.PolicyStatement({
      //     actions: ["s3:PutObject"],
      //     resources: [this.balanceTestBucket.bucketArn + "/parquet_data/*"]

      //   }), new iam.PolicyStatement({ //won't need if sagemaker is using a different Lambda
      //     actions: ["s3:ListBucket"],
      //     resources: [this.balanceTestBucket.bucketArn + "/private/*", this.balanceTestBucket.bucketArn]
      //   })],
      // });

      //TODO: make new Sagemaker role to add permissions to making training job, new endpoint, etc, here; or make a new policy and reference via arn within lambda
      const s3LambdaTriggerPolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
            actions: ["s3:PutObject"],
            resources: [this.balanceTestBucket.bucketArn + "/parquet_data/*"]
  
        }), new iam.PolicyStatement({ 
            actions: ["s3:ListBucket"],
            resources: [this.balanceTestBucket.bucketArn + "/private/*", this.balanceTestBucket.bucketArn]

        }), new iam.PolicyStatement({
            actions: ["s3:GetObject"],
            resources: [this.balanceTestBucket.bucketArn + "/private/*"]

        }), new iam.PolicyStatement({
            actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
            resources: [logGroup.logGroupArn]

        }), new iam.PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            resources: [databaseStack.getDatabaseSecretArn()]
            
        }), new iam.PolicyStatement({
            actions: ["ssm:DescribeParameters", "ssm:GetParameter", "ssm:GetParameters", "ssm:PutParameter"],
            resources: ["*"]

        }), new iam.PolicyStatement({
            actions: ["sagemaker:InvokeEndpoint"],
            resources: [`arn:aws:sagemaker:${region}:${account}:endpoint/${endpointName}`]

        }),
      
      ]
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
          endpoint_name: endpointName,
          dbname: databaseStack.getDatabaseName(),
          host: databaseStack.getDatabaseProxyEndpoint(),
          rds_secret_name: databaseStack.getDatabaseSecretName(),
        },
        functionName: s3LambdaTriggerName,
        memorySize: 512,
        role: s3LambdaTriggerRole,
        timeout: Duration.minutes(5), //TODO: change this to 15 min
        vpc: vpcStack.vpc,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        securityGroups: [securityGroup],
      });

      // const jsonToParquetAndCsvTrigger = new lambda.Function(this, s3LambdaTriggerName, {
      //   runtime: lambda.Runtime.PYTHON_3_9,
      //   functionName: s3LambdaTriggerName,
      //   handler: s3LambdaTriggerFileName + ".lambda_handler",
      //   code: lambda.Code.fromAsset("./lambda/" + s3LambdaTriggerFileName),
      //   timeout: Duration.minutes(3),
      //   memorySize: 512,
      //   role: s3LambdaTriggerRole,
      //   vpc: vpcStack.vpc,
      //   vpcSubnets: {
      //       subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      //   },
      //   securityGroups: [securityGroup],
      // });

      // for adding Pandas library to the function
      // jsonToParquetAndCsvTrigger.addLayers(
      //   lambda.LayerVersion.fromLayerVersionArn(this, 'AWSSDKPandas-Python39', 'arn:aws:lambda:ca-central-1:336392948345:layer:AWSSDKPandas-Python39:4')
      // );

      // set Lambda trigger for the S3 bucket
      this.balanceTestBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3notif.LambdaDestination(s3LambdaTrigger),
        {
          prefix: "private/",
          suffix: ".json"
        }
      );
      
      //TODO: see if we need to delete logs when destroying stacks, or retain
      // make log group for Lambda that generates a report
      const generateReportLambdaLogGroup = new logs.LogGroup(this, generateReportLambdaLogGroupName, {
        logGroupName: `/aws/lambda/${generateReportLambdaName}`,
        removalPolicy: RemovalPolicy.DESTROY
      });

      //TODO: add the correct restrictive permissions for S3, and remove the S3 managed policy
      // make IAM role for Lambda that generates a report
      const generateReportLambdaPolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
          resources: [generateReportLambdaLogGroup.logGroupArn]
        })]
      });
      const generateReportLambdaRole = new iam.Role(this, generateReportLambdaRoleName, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        roleName: generateReportLambdaRoleName,
        description: "Role gives access to appropriate S3 functions needed for doing S3 Select for Lambda.",
        inlinePolicies: { ["BalanceTest-generateReportLambdaPolicy"]: generateReportLambdaPolicyDocument },
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")]
      });

      //TODO: test if layer works
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

      //TODO: see if we need to delete logs when destroying stacks, or retain
      // make log group for Lambda that deletes files from S3
      const deleteS3RecordLambdaLogGroup = new logs.LogGroup(this, deleteS3RecordLambdaLogGroupName, {
        logGroupName: `/aws/lambda/${deleteS3RecordLambdaName}`,
        removalPolicy: RemovalPolicy.DESTROY
      });

      //TODO: add the correct restrictive permissions for S3
      // make IAM role for Lambda that deletes files from S3
      const deleteS3RecordLambdaPolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
          resources: [deleteS3RecordLambdaLogGroup.logGroupArn]

        }), new iam.PolicyStatement({
          actions: ["s3:DeleteObject"],
          resources: [this.balanceTestBucket.bucketArn + "/private/*"]

        }), new iam.PolicyStatement({
          actions: ["s3:DeleteObject"],
          resources: [this.balanceTestBucket.bucketArn + "/parquet_data/*"]

        })]
      });
      const deleteS3RecordLambdaRole = new iam.Role(this, deleteS3RecordLambdaRoleName, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        roleName: deleteS3RecordLambdaRoleName,
        description: "Role gives access to appropriate S3 functions needed for Lambda.",
        inlinePolicies: { ["BalanceTest-deleteS3RecordLambdaPolicy"]: deleteS3RecordLambdaPolicyDocument },
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")]
      });

      //TODO: change to secured StringParameter
      const cognitoIdentityPoolId = ssm.StringParameter.fromStringParameterAttributes(this, "BalanceTestCognitoIdentityPoolId", {
        parameterName: "IdentityPoolId"
      }).stringValue;

      // const cognitoUserPoolId = ssm.StringParameter.fromStringParameterAttributes(this, "BalanceTestCognitoUserPoolId", {
      //   parameterName: "UserPoolId"
      // }).stringValue;
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
          "REGION": region,
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