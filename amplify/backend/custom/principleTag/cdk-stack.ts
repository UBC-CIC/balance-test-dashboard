import * as cdk from '@aws-cdk/core';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';
//import * as iam from '@aws-cdk/aws-iam';
//import * as sns from '@aws-cdk/aws-sns';
//import * as subs from '@aws-cdk/aws-sns-subscriptions';
//import * as sqs from '@aws-cdk/aws-sqs';
import * as customResources from '@aws-cdk/custom-resources';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });
    /* AWS CDK code goes here - learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */
  

    // const dependencies:AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(this, 
    //   amplifyResourceProps.category, 
    //   amplifyResourceProps.resourceName, 
    //   [
    //     {category: 'auth', resourceName: "balancetestdashboard733fb088" },
    //   ]
    // );

    // const IdentityPoolIdOutput = cdk.Fn.ref(dependencies.auth.balancetestdashboard733fb088.IdentityPoolId);
    // const userPoolIdOutput = cdk.Fn.ref(dependencies.auth.balancetestdashboard733fb088.UserPoolId);
    // const createParameters = {
    //   "IdentityPoolId": IdentityPoolIdOutput,
    //   "IdentityProviderName": `cognito-idp.${this.region}.amazonaws.com/${userPoolIdOutput}`,
    //   "PrincipalTags": {
    //     "user_type": "user_type"
    //   },
    //   "UseDefaults": false
    // }

    // const setPrincipalTagAction = {
    //   action: "setPrincipalTagAttributeMap",
    //   service: "CognitoIdentity",
    //   parameters: createParameters,
    //   physicalResourceId: customResources.PhysicalResourceId.of(IdentityPoolIdOutput)
    // }

    // new customResources.AwsCustomResource(this, 'CustomResourcePrincipalTags', {
    //   onCreate: setPrincipalTagAction,
    //   onUpdate: setPrincipalTagAction,
    //   policy: customResources.AwsCustomResourcePolicy.fromSdkCalls({
    //     resources: [`arn:aws:cognito-identity:${this.region}:${this.account}:identitypool/${IdentityPoolIdOutput}`],
    //   }),
    // })
  }
}