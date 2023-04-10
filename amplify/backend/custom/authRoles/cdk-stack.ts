import * as cdk from '@aws-cdk/core';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';
import * as iam from '@aws-cdk/aws-iam';
import {
  IdentityPool,
  UserPoolAuthenticationProvider
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import { Effect } from '@aws-cdk/aws-iam/lib/policy-statement';
//import * as sns from '@aws-cdk/aws-sns';
//import * as subs from '@aws-cdk/aws-sns-subscriptions';
//import * as sqs from '@aws-cdk/aws-sqs';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });
    /* AWS CDK code goes here - learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */
    
    // Example 1: Set up an SQS queue with an SNS topic 

    /*
    const amplifyProjectInfo = AmplifyHelpers.getProjectInfo();
    const sqsQueueResourceNamePrefix = `sqs-queue-${amplifyProjectInfo.projectName}`;
    const queue = new sqs.Queue(this, 'sqs-queue', {
      queueName: `${sqsQueueResourceNamePrefix}-${cdk.Fn.ref('env')}`
    });
    // 👇create sns topic
    
    const snsTopicResourceNamePrefix = `sns-topic-${amplifyProjectInfo.projectName}`;
    const topic = new sns.Topic(this, 'sns-topic', {
      topicName: `${snsTopicResourceNamePrefix}-${cdk.Fn.ref('env')}`
    });
    // 👇 subscribe queue to topic
    topic.addSubscription(new subs.SqsSubscription(queue));
    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });
    */

    // Example 2: Adding IAM role to the custom stack 
    /*
    const roleResourceNamePrefix = `CustomRole-${amplifyProjectInfo.projectName}`;
    
    const role = new iam.Role(this, 'CustomRole', {
      assumedBy: new iam.AccountRootPrincipal(),
      roleName: `${roleResourceNamePrefix}-${cdk.Fn.ref('env')}`
    }); 
    */

    // Example 3: Adding policy to the IAM role
    /*
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['*'],
        resources: [topic.topicArn],
      }),
    );
    */

    // Access other Amplify Resources 
    
    const dependencies:AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(this, 
      amplifyResourceProps.category, 
      amplifyResourceProps.resourceName, 
      [
        {category:'storage',resourceName:'balanceTestS3'},
        {category: 'auth', resourceName: "balancetestdashboard733fb088" },
      ]
    );
    const s3BucketName = cdk.Fn.ref(dependencies.storage.balanceTestS3.BucketName);
    const IdentityPoolIdOutput = cdk.Fn.ref(dependencies.auth.balancetestdashboard733fb088.IdentityPoolId);

    
    const patientS3PolicyDocument = new iam.PolicyDocument({
      statements: [new iam.PolicyStatement({
          actions: ["s3:PutObject",
              "s3:GetObject",
              "s3:DeleteObject"],
          resources: ["arn:aws:s3:::"+s3BucketName+"/parquet_data/patient_tests/user_id=${cognito-identity.amazonaws.com:sub}/*",
              "arn:aws:s3:::"+s3BucketName+"/private/${cognito-identity.amazonaws.com:sub}/*"]
      })]
    });

    const careProviderS3PolicyDocument = new iam.PolicyDocument({
      statements: [new iam.PolicyStatement({
          actions: ["s3:PutObject",
              "s3:GetObject",
              "s3:DeleteObject"],
          resources: ["arn:aws:s3:::"+s3BucketName+"/*"]
      })]
    });


    // const patientRole = new iam.Role(this, 'Role', {
    //   assumedBy: new iam.ServicePrincipal('cognito-identity.amazonaws.com'),
    //   description: 'role to allow patients to have access to their own data in s3',
    //   inlinePolicies: { ["BalanceTest-patientS3Policy"]: patientS3PolicyDocument }
    // });

    // const careProviderRole = new iam.Role(this, 'Role', {
    //   assumedBy: new iam.ServicePrincipal('cognito-identity.amazonaws.com'),
    //   description: 'role to allow care providers to have access to patients data in s3',
    //   inlinePolicies: { ["BalanceTest-careProviderS3Policy"]: careProviderS3PolicyDocument }
    // });



    // resources.identityPoolRoleMap.roleMappings={
    // roleMappingKey:{
    //     rulesConfiguration:{
    //         rules:[
    //             {
    //                 claim:'user_type',
    //                 matchType:'Equals',
    //                 roleArn:patientRole.roleArn,
    //                 value:'patient' 
    //             }
    //         ]
    //     },
    //     type:''
    // }
    // };



    const identityPool = IdentityPool.fromIdentityPoolId(this, 'identity-pool', IdentityPoolIdOutput);
    // const identityPoolProviderUrl: cognito_identitypool_alpha.IdentityPoolProviderUrl;
    // const role: iam.Role;
    // const identityPoolRoleAttachment = new cognito_identitypool_alpha.IdentityPoolRoleAttachment(this, 'MyIdentityPoolRoleAttachment', {
    //   identityPool: identityPool,

    //   // the properties below are optional
    //   authenticatedRole: role,
    //   roleMappings: [{
    //     providerUrl: identityPoolProviderUrl,

    //     // the properties below are optional
    //     mappingKey: 'mappingKey',
    //     resolveAmbiguousRoles: false,
    //     rules: [{
    //       claim: 'claim',
    //       claimValue: 'claimValue',
    //       mappedRole: role,

    //       // the properties below are optional
    //       matchType: cognito_identitypool_alpha.RoleMappingMatchType.EQUALS,
    //     }],
    //     useToken: false,
    //   }],
    //   unauthenticatedRole: role,
    // });
    // identityPool.authenticatedRole.attachInlinePolicy(
    //   new iam.Policy(this, "S3IdenityPoolAccessPolicy", {
    //     document: new iam.PolicyDocument({
    //       statements: [
    //         new PolicyStatement({
    //           actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    //           resources: [`arn:aws:s3:::${s3BucketName}`],
    //           effect: Effect.ALLOW
    //         }),
    //         new PolicyStatement({
    //           actions: ["s3:GetObject"],
    //           resources: [`${bucket.bucketArn}/user/*`],
    //           effect: Effect.ALLOW
    //         })
    //       ]
    //     })
    //   })
    // );  
  }
}