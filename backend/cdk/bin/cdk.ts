#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataWorkflowStack } from '../lib/data-workflow-stack';
import { VPCStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { AthenaGlueStack } from '../lib/athena-glue-stack';

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
const vpcStack = new VPCStack(app, "VPCStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

const dataWorkflowStack = new DataWorkflowStack(app, 'DataWorkflowStack',  vpcStack, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

const glueAthenaStack = new AthenaGlueStack(app, "AthenaGlueStack", dataWorkflowStack, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});



