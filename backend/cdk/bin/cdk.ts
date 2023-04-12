#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';
import { DataWorkflowStack } from '../lib/data-workflow-stack';
import { VPCStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { AthenaGlueStack } from '../lib/athena-glue-stack';
import { SagemakerStack } from '../lib/sagemaker-stack';
import { AppsyncStack } from '../lib/appsync-resolvers-stack';

const app = new cdk.App();
// new CdkStack(app, 'CdkStack', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });

const cognitoStack = new CognitoStack(app, "CognitoStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

const vpcStack = new VPCStack(app, "VPCStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

const dataWorkflowStack = new DataWorkflowStack(app, 'DataWorkflowStack', vpcStack, cognitoStack, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

const databaseStack = new DatabaseStack(app, "DatabaseStack", vpcStack, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// const sagemakerStack = new SagemakerStack(app, "SagemakerStack", vpcStack, dataWorkflowStack, databaseStack, {
//     env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
// });

// const athenaGlueStack = new AthenaGlueStack(app, "AthenaGlueStack", vpcStack, dataWorkflowStack, {
//     env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
// });

// const appsyncStack = new AppsyncStack(app, "AppsyncStack", vpcStack, dataWorkflowStack, athenaGlueStack, databaseStack, {
//     env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
// });