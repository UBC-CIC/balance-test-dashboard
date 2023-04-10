import { AmplifyAuthCognitoStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import * as iam from '@aws-cdk/aws-iam';
import * as cognito from '@aws-cdk/aws-cognito';


export function override(resources: AmplifyAuthCognitoStackTemplate) {
    const userTypeAttribute = {
    attributeDataType: 'String',
    developerOnlyAttribute: false,
    mutable: true,
    name: 'user_type',
    // todo: make this required?
    required: false,
    }
    const identityIdAttribute = {
    attributeDataType: 'String',
    developerOnlyAttribute: false,
    mutable: true,
    name: 'identity_id',
    // todo: make this required?
    required: false,
    }

    resources.userPool.schema = [
    ...(resources.userPool.schema as any[]), // Carry over existing attributes (example: email)
    userTypeAttribute,
    identityIdAttribute
    ]

    resources.userPoolClient.readAttributes = [ //set readable attributes
    "email",
    'family_name',
    'given_name',
    "custom:identity_id",
    "custom:user_type",
    ];

    resources.userPoolClient.writeAttributes = [ //set readable attributes
    "email",
    'family_name',
    'given_name',
    "custom:identity_id",
    "custom:user_type",
    ];

    // const patientS3PolicyDocument = new iam.PolicyDocument({
    //     statements: [new iam.PolicyStatement({
    //         actions: ["s3:PutObject",
    //             "s3:GetObject",
    //             "s3:DeleteObject"],
    //         resources: ["arn:aws:s3:::json-to-parquet-poc-bucket/parquet_data/patient_tests/user_id=${cognito-identity.amazonaws.com:sub}/*",
    //             "arn:aws:s3:::json-to-parquet-poc-bucket/private/${cognito-identity.amazonaws.com:sub}/*"]
    //     })]
    // });


    // const patientRole = new iam.Role(this, 'Role', {
    // assumedBy: new iam.ServicePrincipal('cognito-identity.amazonaws.com'),
    // description: 'role to allow patients to have access to their own data in s3',
    // inlinePolicies: { ["BalanceTest-patientS3Policy"]: patientS3PolicyDocument }
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

  
//   resources.userPool.policies = { // Set the user pool policies
//     passwordPolicy: {
//       ...resources.userPool.policies["passwordPolicy"], // Carry over existing settings
//       temporaryPasswordValidityDays: 3 // Add new setting not provided Amplify's default
//     }
//   }
}
