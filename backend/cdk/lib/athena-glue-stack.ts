import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { DataWorkflowStack } from './data-workflow-stack';
import { VPCStack } from "./vpc-stack";
import * as cdk from 'aws-cdk-lib';

export class AthenaGlueStack extends Stack {

    private readonly athenaS3QueryLambda: lambda.Function;

    constructor(scope: App, id: string, dataWorkflowStack: DataWorkflowStack, props: StackProps) {
      super(scope, id, props);

      const glueDbName = "BalanceTest-SensorData-GlueDb";
      const glueSensorDataCrawlerS3Arn = dataWorkflowStack.getS3BucketArn() + "/parquet_data/patient_tests/*";
      const glueSensorDataCrawlerRoleName = "BalanceTest-SensorData-GlueCrawler-Role";
      const glueSensorDataCrawlerS3Path = "s3://" + dataWorkflowStack.getS3BucketName() + "/parquet_data/patient_tests/*";
      const glueSensorDataCrawlerName = "BalanceTest-SensorData-GlueCrawler";
    
      let accountId = "";
      if (props["env"] && props["env"]["account"]) {
        accountId = props["env"]["account"];
        console.log(accountId) //TODO: remove after testing
      }

      //TODO: check if props['env']['account'] gives account id
      
      const glueDb = new glue.CfnDatabase(this, glueDbName, {
        catalogId: accountId,
        databaseInput: {
          name: glueDbName,
        }
      });

      //TODO: check permissions for role, such as if the policies need to be restricted
      // make Glue permissions/role
      let glueSensorDataCrawlerPolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          actions: ["s3:GetObject", "s3:PutObject"],
          resources: [glueSensorDataCrawlerS3Arn]
        })]
      });
      let glueSensorDataCrawlerRole = new iam.Role(this, glueSensorDataCrawlerRoleName, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        roleName: glueSensorDataCrawlerRoleName,
        description: "Role gives access to appropriate S3 functions needed for crawling data with Glue.",
        inlinePolicies: { ["BalanceTest-athenaQueryS3Policy"]: glueSensorDataCrawlerPolicyDocument },
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AWSGlueServiceRole")]
      });

      // make Glue crawler for crawling S3 sensor data
      const glueSensorDataCrawler = new glue.CfnCrawler(this, glueSensorDataCrawlerName, {
        role: glueSensorDataCrawlerRole.roleArn,
        targets: {
          s3Targets: [{
            path: glueSensorDataCrawlerS3Path
          }]
        },
        databaseName: glueDbName,
        name: glueSensorDataCrawlerName,
        description: "For crawling parquet data within the S3 bucket for Athena querying",
        recrawlPolicy: {
          recrawlBehavior: "CRAWL_EVERYTHING"
        },
        schemaChangePolicy: {
          updateBehavior: "UPDATE_IN_DATABASE",
          deleteBehavior: "DEPRECATE_IN_DATABASE"
        },
        //TODO: deploy and test to see if table prefix is needed to help organize tables
      });
      
      // adding some naming
      const athenaS3QueryLambdaFileName = "query-s3";
      const athenaS3QueryLambdaName = "BalanceTest-query-S3";
      const athenaQueryS3RoleName = "BalanceTest-AthenaQueryS3-Lambda-Role";
      const athenaDataCatalogName = "BalanceTestAthenaDataCatalog";
      const logGroupName = "BalanceTest-AthenaQueryS3-Logs";

      // create log group for Lambda that uses Athena to query S3
      const logGroup = new logs.LogGroup(this, logGroupName, {
        logGroupName: `/aws/lambda/${athenaS3QueryLambdaName}`,
        removalPolicy: RemovalPolicy.DESTROY
      });

      //TODO: add the necessary restrictive IAM policy statements, and remove managed policies
      //make IAM role for Lambda to query S3
      let athenaQueryS3PolicyDocument = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          actions: ["logs:CreateLogStream", "logs:CreateLogGroup", "logs:PutLogEvents"],
          resources: [logGroup.logGroupArn]
        })]
      });
      let athenaQueryS3Role = new iam.Role(this, athenaQueryS3RoleName, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        roleName: athenaQueryS3RoleName,
        description: "Role gives access to appropriate S3 functions needed for querying from bucket for Lambda.",
        inlinePolicies: { ["BalanceTest-athenaQueryS3Policy"]: athenaQueryS3PolicyDocument },
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonAthenaFullAccess")]
      });

      //make Lambda for Athena to query to S3
      this.athenaS3QueryLambda = new lambda.Function(this, athenaS3QueryLambdaName, {
        runtime: lambda.Runtime.PYTHON_3_9,
        functionName: athenaS3QueryLambdaName,
        handler: athenaS3QueryLambdaFileName + ".handler",
        code: lambda.Code.fromAsset("./lambda/" + athenaS3QueryLambdaFileName),
        timeout: Duration.minutes(3),
        memorySize: 512,
        role: athenaQueryS3Role,
        //vpc: vpcStack.vpc,
      });    

      //TODO: check athena configuration and other related parts; see if we actually need this by deploying
      const athenaDataCatalog = new athena.CfnDataCatalog(this, athenaDataCatalogName, {
        name: athenaDataCatalogName,
        type: "GLUE",
        parameters: {["catalog-id"]: accountId}
      });

    }

    public getAthenaS3QueryLambda(): lambda.Function {
      return this.athenaS3QueryLambda;
    }
}