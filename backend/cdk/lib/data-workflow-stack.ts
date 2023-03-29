import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3notif from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from 'aws-cdk-lib';
import { VPCStack } from './vpc-stack';

//TODO: figure out if we want to change this to only S3-related stack, and then have Sagemaker as its own stack
//TODO: figure out how to add access point/connect to vpc
export class DataWorkflowStack extends Stack {

    private readonly balanceTestBucket: s3.Bucket;
    private readonly generateReportLambda: lambda.Function;
    private readonly deleteS3RecordLambda: lambda.Function;

    constructor(scope: App, id: string, vpcStack: VPCStack, props?: StackProps) {
      super(scope, id, props);
      
      const balanceTestBucketName = "balancetest-datastorage-bucket";
      const s3LambdaTriggerName = "BalanceTest-convert-json-to-parquet-and-csv";
      const s3LambdaTriggerFileName = "s3-trigger-convert-json-to-parquet-and-csv";
      const logGroupName = "BalanceTest-S3LambdaTrigger-Logs";
      const s3LambdaTriggerRoleName = "BalanceTest-S3LambdaTrigger-Role";

      const generateReportLambdaName = "BalanceTest-generate-report-for-download";
      const generateReportLambdaFileName = "generateReportForDownload";
      const generateReportLambdaRoleName = "BalanceTest-generateReportLambda-Role";
      const generateReportLambdaLogGroupName = "BalanceTest-generateReportLambda-Logs";

      const deleteS3RecordLambdaName = "BalanceTest-delete-s3-record";
      const deleteS3RecordLambdaFileName = "delete-s3-record";
      const deleteS3RecordLambdaRoleName = "BalanceTest-deleteS3RecordLambda-Role";
      const deleteS3RecordLambdaLogGroupName = "BalanceTest-deleteS3RecordLambda-Logs";


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

      // create log group
      const logGroup = new logs.LogGroup(this, logGroupName, {
        logGroupName: `/aws/lambda/${s3LambdaTriggerName}`,
        removalPolicy: RemovalPolicy.RETAIN
      });

      //create policy document and role for Lambda trigger
      const s3LambdaTriggerPolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          actions: ["s3:GetObject"],
          resources: [this.balanceTestBucket.bucketArn + "/private/*"]

        }), new iam.PolicyStatement ({
          actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
          resources: [logGroup.logGroupArn]
          
        }), new iam.PolicyStatement({
          actions: ["s3:PutObject"],
          resources: [this.balanceTestBucket.bucketArn + "/parquet_data/*"]

        }), new iam.PolicyStatement({ //won't need if sagemaker is using a different Lambda
          actions: ["s3:ListBucket"],
          resources: [this.balanceTestBucket.bucketArn + "/private/*", this.balanceTestBucket.bucketArn]
        })],
      });
      // s3LambdaTriggerPolicy.applyRemovalPolicy(RemovalPolicy.DESTROY);
      
      const s3LambdaTriggerRole = new iam.Role(this, s3LambdaTriggerRoleName, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        roleName: s3LambdaTriggerRoleName,
        description: "Role gives access to appropriate S3 functions needed for file conversions and logging for Lambda.",
        inlinePolicies: { ["BalanceTest-s3LambdaTriggerPolicy"]: s3LambdaTriggerPolicyDocument }
      });

      // make Lambda Trigger
      const jsonToParquetAndCsvTrigger = new lambda.Function(this, s3LambdaTriggerName, {
        runtime: lambda.Runtime.PYTHON_3_9,
        functionName: s3LambdaTriggerName,
        handler: s3LambdaTriggerFileName + ".lambda_handler",
        code: lambda.Code.fromAsset("./lambda/" + s3LambdaTriggerFileName),
        timeout: Duration.minutes(3),
        memorySize: 512,
        role: s3LambdaTriggerRole,
        //vpc: vpcStack.vpc,
      });

      // for adding Pandas library to the function
      jsonToParquetAndCsvTrigger.addLayers(
        lambda.LayerVersion.fromLayerVersionArn(this, 'AWSSDKPandas-Python39', 'arn:aws:lambda:ca-central-1:336392948345:layer:AWSSDKPandas-Python39:4')
      );

      // set Lambda trigger for the S3 bucket
      this.balanceTestBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3notif.LambdaDestination(jsonToParquetAndCsvTrigger),
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
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")]
      });

      //TODO: add python layers for this lambda, and figure out what is needed to connect to the lambda
      // make Lambda to generate a PDF report for downloading in dashboard
      this.generateReportLambda = new lambda.Function(this, generateReportLambdaName, {
        runtime: lambda.Runtime.PYTHON_3_7,
        functionName: generateReportLambdaName,
        handler: generateReportLambdaFileName + ".lambda_handler",
        code: lambda.Code.fromAsset("./lambda/" + generateReportLambdaFileName),
        timeout: Duration.minutes(3),
        memorySize: 512,
        role: generateReportLambdaRole,
        // layers: [],
        //vpc: vpcStack.vpc,
      });

      // make log group for Lambda that deletes files from S3
      const deleteS3RecordLambdaLogGroup = new logs.LogGroup(this, deleteS3RecordLambdaLogGroupName, {
        logGroupName: `/aws/lambda/${deleteS3RecordLambdaName}`,
        removalPolicy: RemovalPolicy.RETAIN
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
      });

      //TODO: double check Lambda
      // make Lambda to delete a test event record from S3
      this.deleteS3RecordLambda = new lambda.Function(this, deleteS3RecordLambdaName, {
        runtime: lambda.Runtime.PYTHON_3_7,
        functionName: deleteS3RecordLambdaName,
        handler: deleteS3RecordLambdaFileName + ".lambda_handler",
        code: lambda.Code.fromAsset("./lambda/" + deleteS3RecordLambdaFileName),
        timeout: Duration.minutes(3),
        memorySize: 512,
        role: deleteS3RecordLambdaRole,
        //vpc: vpcStack.vpc,
      });

      //TODO: add new S3 bucket (if needed) and figure out how to store data/model artifacts in there

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