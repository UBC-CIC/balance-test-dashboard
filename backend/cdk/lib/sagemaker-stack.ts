import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as sagemaker from "aws-cdk-lib/aws-sagemaker";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from 'aws-cdk-lib';
import { VPCStack } from './vpc-stack';
import { DataWorkflowStack } from './data-workflow-stack';
import { DatabaseStack } from './database-stack';

export class SagemakerStack extends Stack {

    private readonly sagemakerBucket: s3.Bucket;
    private readonly sagemakerCalls_Lambda: lambda.Function;

    constructor(scope: App, id: string, vpcStack: VPCStack, dataWorkflowStack: DataWorkflowStack, 
                databaseStack: DatabaseStack, props?: StackProps) {
        super(scope, id, props);

        const sagemakerBucketName = "balancetest-sagemaker-bucket";
        const sagemakerNotebookName = "BalanceTest-sit-to-stand-model-notebook";
        const sagemakerNotebookRoleName = "BalanceTest-sit-to-stand-model-notebook-role";
        
        //TODO: Add the code to the Lambda file
        const sagemakerCalls_LambdaFileName = "sagemaker-calls";
        const sagemakerCalls_LambdaLogGroupName = "BalanceTest-SagemakerCalls-Lambda-Logs"
        const sagemakerCalls_LambdaName = "BalanceTest-Sagemaker-Calls";
        const sagemakerCalls_LambdaRoleName = "BalanceTest-SagemakerCalls-Lambda-Role";

        this.sagemakerBucket = new s3.Bucket(this, sagemakerBucketName, {
            bucketName: sagemakerBucketName,
            removalPolicy: RemovalPolicy.RETAIN,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            publicReadAccess: false,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED
        })

        //TODO: limit IAM permissions; change the bucket arn if needed
        // make Sagemaker notebook permissions/role
        let sagemakerNotebookPolicyDocument = new iam.PolicyDocument({
            statements: [new iam.PolicyStatement({
            actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
            resources: [this.sagemakerBucket.bucketArn]
            })]
        });
        let sagemakerNotebookRole = new iam.Role(this, sagemakerNotebookRoleName, {
            assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
            roleName: sagemakerNotebookRoleName,
            description: "Role gives access to appropriate S3 functions needed for Sagemaker.",
            inlinePolicies: { ["BalanceTest-sagemakerNotebookPolicy"]: sagemakerNotebookPolicyDocument },
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess")]
        });

        // make the notebook instance for Sagemaker
        // const notebookInstance = new sagemaker.CfnNotebookInstance(this, sagemakerNotebookName, {
        //     instanceType: "ml.t3.medium",
        //     roleArn: sagemakerNotebookRole.roleArn,
        //     volumeSizeInGb: 5,
        //     platformIdentifier: "notebook-al2-v2",
        //     instanceMetadataServiceConfiguration: {
        //         minimumInstanceMetadataServiceVersion: "2"
        //     },
        //     //defaultCodeRepository: ,
        //     //directInternetAccess: "Disabled",
        //     //subnetId: ,
        //     //securityGroupIds: [],
        // });

        // create log group for Lambda that calls Sagemaker endpoints
        const logGroup = new logs.LogGroup(this, sagemakerCalls_LambdaLogGroupName, {
            logGroupName: `/aws/lambda/${sagemakerCalls_LambdaName}`,
            removalPolicy: RemovalPolicy.DESTROY
        });

        //TODO: restrict IAM permissions, and remove managed policies as needed
        // make IAM role for a Lambda that calls Sagemaker endpoints
        const sagemakerCalls_LambdaPolicyDocument = new iam.PolicyDocument({
            statements: [new iam.PolicyStatement({
                actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
                resources: [this.sagemakerBucket.bucketArn]
            })]
        })
        const sagemakerCalls_LambdaRole = new iam.Role(this, sagemakerCalls_LambdaRoleName, {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            roleName: sagemakerCalls_LambdaRoleName,
            description: "Role gives access to appropriate permissions for the Lambda that calls Sagemaker.",
            inlinePolicies: { ["BalanceTest-SagemakerCallsPolicy"]: sagemakerCalls_LambdaPolicyDocument },
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess")]
        });

        // make Lambda function that calls Sagemaker endpoints
        this.sagemakerCalls_Lambda = new lambda.Function(this, sagemakerCalls_LambdaName, {
            runtime: lambda.Runtime.PYTHON_3_9,
            functionName: sagemakerCalls_LambdaName,
            handler: sagemakerCalls_LambdaFileName + ".lambda_handler",
            code: lambda.Code.fromAsset("./lambda/" + sagemakerCalls_LambdaFileName),
            timeout: Duration.minutes(3),
            memorySize: 512,
            role: sagemakerCalls_LambdaRole,
            environment: {
                "S3_BUCKET_NAME": this.sagemakerBucket.bucketName
            },
            // vpc: vpcStack.vpc,
        });


    }

    public getSagemakerBucketName(): string {
        return this.sagemakerBucket.bucketName;
    }

    public getSagemakerBucketArn(): string {
        return this.sagemakerBucket.bucketArn;
    }
}