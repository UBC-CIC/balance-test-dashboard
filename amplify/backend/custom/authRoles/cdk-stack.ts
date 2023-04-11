import * as cdk from '@aws-cdk/core';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';
import * as iam from '@aws-cdk/aws-iam';
import * as cognito from '@aws-cdk/aws-cognito'
// import {
//   IdentityPool,
//   UserPoolAuthenticationProvider,
//   IdentityPoolRoleAttachment
// } from "@aws-cdk/aws-cognito-identitypool-alpha";
// import * as idp from 'aws-cdk/@aws-cdk/aws-cognito-identitypool-alpha'
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
    const userPoolIdOutput = cdk.Fn.ref(dependencies.auth.balancetestdashboard733fb088.UserPoolId);
    const appClientIdOutput = cdk.Fn.ref(dependencies.auth.balancetestdashboard733fb088.AppClientID);
    const appClientWebIdOutput = cdk.Fn.ref(dependencies.auth.balancetestdashboard733fb088.AppClientIDWeb);

    // const patientS3PolicyDocument = new iam.PolicyDocument({
    //   statements: [new iam.PolicyStatement({
    //       actions: ["s3:PutObject",
    //           "s3:GetObject",
    //           "s3:DeleteObject"],
    //       resources: ["arn:aws:s3:::"+s3BucketName+"/parquet_data/patient_tests/user_id=${cognito-identity.amazonaws.com:sub}/*",
    //           "arn:aws:s3:::"+s3BucketName+"/private/${cognito-identity.amazonaws.com:sub}/*"]
    //   })]
    // });

    // const careProviderS3PolicyDocument = new iam.PolicyDocument({
    //   statements: [new iam.PolicyStatement({
    //       actions: ["s3:PutObject",
    //           "s3:GetObject",
    //           "s3:DeleteObject"],
    //       resources: ["arn:aws:s3:::"+s3BucketName+"/*"]
    //   })]
    // });


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

    // const authRole = new iam.Role(this, 'Role', {
    //   assumedBy: new iam.ServicePrincipal('cognito-identity.amazonaws.com'),
    //   description: 'role to allow patients to have access to their own data in s3',
    //   inlinePolicies: { ["BalanceTest-patientS3Policy"]: patientS3PolicyDocument }
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

    // console.log('identitypoolidoutput', IdentityPoolIdOutput)

    // const identityPool = IdentityPool.fromIdentityPoolArn(this, 'identity-pool', 
    // `arn:aws:cognito-identity:${this.region}:${this.account}:identitypool/ca-central-1:${IdentityPoolIdOutput}`
    // 'arn:aws:cognito-identity:ca-central-1:684904187051:identitypool/ca-central-1:6f2220ef-c911-41af-b4df-2c86b050f3eb'
    // 'ca-central-1:6f2220ef-c911-41af-b4df-2c86b050f3eb'
    // IdentityPoolIdOutput
    // );
    // const identityPoolProviderUrl: cognito_identitypool_alpha.IdentityPoolProviderUrl;
    // const role: iam.Role;
    // const identityPoolRoleAttachment = new IdentityPoolRoleAttachment(this, 's3AuthRoleAttachment', {
    //   identityPool: identityPool,

    //   // the properties below are optional
    //   authenticatedRole: authRole,
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
    //         new iam.PolicyStatement({
    //           // actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    //           // resources: [`arn:aws:s3:::${s3BucketName}`],
    //           // effect: Effect.ALLOW
    //           actions: ["s3:PutObject",
    //               "s3:GetObject",
    //               "s3:DeleteObject"],
    //           resources: ["arn:aws:s3:::"+s3BucketName+"/parquet_data/patient_tests/user_id=${cognito-identity.amazonaws.com:sub}/*",
    //               "arn:aws:s3:::"+s3BucketName+"/private/${cognito-identity.amazonaws.com:sub}/*"]
    //         }),
    //         // new iam.PolicyStatement({
    //         //   actions: ["s3:GetObject"],
    //         //   resources: [`${bucket.bucketArn}/user/*`],
    //         //   effect: Effect.ALLOW
    //         // })
    //       ]
    //     })
    //   })
    // );  
    const identityPool = new cognito.CfnIdentityPool(this, 'BalanceTestCognitoIdentityPool', {
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [{
            clientId: appClientIdOutput,
            providerName: `cognito-idp.${this.region}.amazonaws.com/${userPoolIdOutput}`,
        },
      {
            clientId: appClientWebIdOutput,
            providerName: `cognito-idp.${this.region}.amazonaws.com/${userPoolIdOutput}`,
        }],
    });
    const authenticatedRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
        assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
            "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
            "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
        }, 
        "sts:AssumeRoleWithWebIdentity"),
    });
    // authenticatedRole.grant(
    //   new iam.FederatedPrincipal('cognito-identity.amazonaws.com',
    //     {
    //         "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
    //         "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
    //     }), 
    //     "sts:TagSession")
    authenticatedRole.assumeRolePolicy.addStatements(
      new iam.PolicyStatement({
        principals: [
          new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
            "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
            "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
          })
        ],
        actions:["sts:TagSession", 'sts:AssumeRoleWithWebIdentity']
    })
    )
    authenticatedRole.addToPolicy(new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "s3:PutObject",
            "s3:GetObject",
            "s3:DeleteObject"
        ],
        resources: ["arn:aws:s3:::json-to-parquet-poc-bucket/parquet_data/patient_tests/user_id=${cognito-identity.amazonaws.com:sub}/*",
                "arn:aws:s3:::json-to-parquet-poc-bucket/private/${cognito-identity.amazonaws.com:sub}/*"],
    }));
    authenticatedRole.addToPolicy(new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "s3:PutObject",
            "s3:GetObject",
            "s3:DeleteObject"
        ],
        resources: ["arn:aws:s3:::json-to-parquet-poc-bucket/*"],
        conditions:{
          'StringEquals':{"aws:PrincipalTag/user_type": "care_provider_user"}
        }
    }));
    authenticatedRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'athenaManagedPolicy', 'arn:aws:iam::aws:policy/AmazonAthenaFullAccess'));
    authenticatedRole.addToPolicy(new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "mobileanalytics:PutEvents",
            "cognito-sync:*",
            "cognito-identity:*"
        ],
        resources: ["*"],
    }));
    const unauthenticatedRole = new iam.Role(this, 'CognitoDefaultUnauthenticatedRole', {
        assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
            "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
            "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
        }, "sts:AssumeRoleWithWebIdentity"),
    });
    unauthenticatedRole.addToPolicy(new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "mobileanalytics:PutEvents",
            "cognito-sync:*"
        ],
        resources: ["*"],
    }));
    const defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
        identityPoolId: identityPool.ref,
        roles: {
            'unauthenticated': unauthenticatedRole.roleArn,
            'authenticated': authenticatedRole.roleArn
        }
    });
  }
}