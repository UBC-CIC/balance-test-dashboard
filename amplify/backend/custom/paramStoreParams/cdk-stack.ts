import * as cdk from '@aws-cdk/core';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import * as ssm from '@aws-cdk/aws-ssm';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';
//import * as iam from '@aws-cdk/aws-iam';
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
    
    
    const dependencies:AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(this, 
        amplifyResourceProps.category, 
        amplifyResourceProps.resourceName, 
        [
          {category: 'api', resourceName: "balancetestdashboard"},
          {category: 'auth', resourceName: "balancetestdashboard733fb088" },
          {category:'storage',resourceName:'balanceTestS3'}
        ]
      );
      const GraphQLAPIIdOutput = cdk.Fn.ref(dependencies.api.balancetestdashboard.GraphQLAPIIdOutput)
      const GraphQLAPIEndpointOutput = cdk.Fn.ref(dependencies.api.balancetestdashboard.GraphQLAPIEndpointOutput)
      const UserPoolIdOutput = cdk.Fn.ref(dependencies.auth.balancetestdashboard733fb088.UserPoolId);
      const s3BucketName = cdk.Fn.ref(dependencies.storage.balanceTestS3.BucketName);

      /* AWS CDK code goes here - learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */
      new ssm.StringParameter(this, 'ParameterStoreGraphQLAPIId', {
        parameterName: 'GraphqlApiId',
        stringValue: GraphQLAPIIdOutput,
      });
      new ssm.StringParameter(this, 'ParameterStoreGraphQLAPIEndpoint', {
        parameterName: 'GraphQLAPIEndpoint',
        stringValue: GraphQLAPIEndpointOutput,
      });

      new ssm.StringParameter(this, 'ParameterStoreUserPoolId', {
        parameterName: 'UserPoolId',
        stringValue: UserPoolIdOutput,
      });
      new ssm.StringParameter(this, 'ParameterStoreS3BucketName', {
        parameterName: 'S3BucketName',
        stringValue: s3BucketName,
      });
    }
}