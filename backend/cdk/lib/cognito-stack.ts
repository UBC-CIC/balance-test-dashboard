import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';
import { balanceTestBucketName, DataWorkflowStack } from './data-workflow-stack';
import { StringAttribute } from 'aws-cdk-lib/aws-cognito';

export class CognitoStack extends Stack {
    public readonly UserPoolId: string;

    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const assignUserGroupFunction = new lambda.Function(this, 'AssignUserGroupFunction', {
            functionName: "BalanceTestAssignUserGroupFunction",
            code: lambda.Code.fromAsset("./lambda/" + 'assignUserGroup'),
            handler: 'assign-user-group.handler',
            runtime: lambda.Runtime.NODEJS_14_X,
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            // role: lambdaTriggerRole,
        });

        const addClaimsFunction = new lambda.Function(this, 'AddClaimsFunction', {
            functionName: "BalanceTestAddClaimsFunction",
            code: lambda.Code.fromAsset("./lambda/" + 'addClaims'),
            handler: 'add-usertype-claim.handler',
            runtime: lambda.Runtime.NODEJS_14_X,
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            // role: lambdaTriggerRole,
        });        
        // User Pool
        const userPool = new cognito.UserPool(this, 'BalanceTestUserPool', {
            userPoolName: 'balance-test-user-pool',
            selfSignUpEnabled: true,
            userVerification: {
              emailSubject: 'Verify your email for Balance Test!',
              emailBody: 'Your verification code is {####}',
            },
            signInAliases: {
                email: true,
                phone: false
            },
            autoVerify: { 
                email: true
            },
            standardAttributes: {
                // TODO: Add fullname in the future
                familyName:{
                    required: true,
                    mutable: true
                },
                givenName:{
                    required: true,
                    mutable: true
                },
            },
            customAttributes: {
                // 'joinedOn': new DateTimeAttribute(),
                'user_type': new StringAttribute(),
                'identity_id': new StringAttribute(),
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            lambdaTriggers: {
                // postConfirmation: createPatientsDetailFunction,
                postConfirmation: assignUserGroupFunction,
                preTokenGeneration: addClaimsFunction
            }
        });
        this.UserPoolId = userPool.userPoolId;
        
        // const lambdaTriggerRole = new iam.Role(this, 'BalanceTestCognitoLambdaRole', {
        //     roleName: 'BalanceTestCognitoLambdaRole',
        //     assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        //     inlinePolicies: {
        //         additional: new iam.PolicyDocument({
        //                 statements: [
        //                 new iam.PolicyStatement({
        //                     effect: iam.Effect.ALLOW,
        //                     actions: [
        //                         // Lambda
        //                         'lambda:InvokeFunction',
        //                         // CloudWatch
        //                         "logs:CreateLogStream",
        //                         "logs:CreateLogGroup",
        //                         "logs:PutLogEvents",
        //                         // Cognito
        //                         "cognito-idp:AdminAddUserToGroup",
        //                     ],
        //                     resources: [
        //                         `arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${this.UserPoolId}`,
        //                         "arn:aws:logs:*:*:*",
        //                     ]
        //                 })
        //             ]
        //         }),
        //     },
        // });

        assignUserGroupFunction.role!.grantAssumeRole(new iam.ServicePrincipal('lambda.amazonaws.com'))
        
        assignUserGroupFunction.role!.attachInlinePolicy(new iam.Policy(this, 'AssignUserGroupPolicy', {
            statements: [ 
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        // Lambda
                        'lambda:InvokeFunction',
                        // CloudWatch
                        "logs:CreateLogStream",
                        "logs:CreateLogGroup",
                        "logs:PutLogEvents",
                        // Cognito
                        "cognito-idp:AdminAddUserToGroup",
                    ],
                    resources: [
                        `arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${this.UserPoolId}`,
                        "arn:aws:logs:*:*:*",
                    ]
                })
            ]
        }));

        addClaimsFunction.role!.grantAssumeRole(new iam.ServicePrincipal('lambda.amazonaws.com'))
        
        addClaimsFunction.role!.attachInlinePolicy(new iam.Policy(this, 'AddClaimsPolicy', {
            statements: [ 
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        // Lambda
                        'lambda:InvokeFunction',
                        // CloudWatch
                        "logs:CreateLogStream",
                        "logs:CreateLogGroup",
                        "logs:PutLogEvents",
                        // Cognito
                        // "cognito-idp:AdminAddUserToGroup",
                    ],
                    resources: [
                        `arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${this.UserPoolId}`,
                        "arn:aws:logs:*:*:*",
                    ]
                })
            ]
        }));

        const patientGroup = new cognito.CfnUserPoolGroup(this, 'BalanceTestPatientUserGroup', {
            userPoolId: this.UserPoolId,
            groupName: 'patient',
            // roleArn: 'roleArn',
        });

        const careProviderGroup = new cognito.CfnUserPoolGroup(this, 'BalanceTestCareProviderUserGroup', {
            userPoolId: this.UserPoolId,
            groupName: 'careProvider',
            // roleArn: 'roleArn',
        });


        // User Pool Client
        const userPoolClient = new cognito.CfnUserPoolClient(this, 'BalanceTestUserPoolClient', {
            clientName: 'BalanceTestUserPoolClient',
            userPoolId: userPool.userPoolId,
            explicitAuthFlows: [
                "ALLOW_USER_SRP_AUTH",
                "ALLOW_REFRESH_TOKEN_AUTH",
                // "ALLOW_ADMIN_USER_PASSWORD_AUTH",
                "ALLOW_CUSTOM_AUTH"
            ],
            readAttributes:[
                "custom:identity_id",
                "email",
                "email_verified",
                "family_name",
                "given_name",
                "name",
                "updated_at",
                "zoneinfo"
            ],
            // writeAttributes:[
            //     "custom:identity_id",
            //     "email",
            //     "email_verified",
            //     "family_name",
            //     "given_name",
            //     "name",
            //     "updated_at",
            //     "zoneinfo"
            // ]
        });

        // Identity Pool
        const identityPool = new cognito.CfnIdentityPool(this, 'BalanceTestIdentityPool', {
            identityPoolName: 'BalanceTestIdentityPool',
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [{
                clientId: userPoolClient.ref,
                providerName: userPool.userPoolProviderName
            }]
        });

        // Unauthenticated Role
        const unauthenticatedRole = new iam.Role(
            this,
            "BalanceTest_Website_Unauthenticated_Role",
            {
                roleName: "BalanceTest_Website_Unauthenticated_Role",
                assumedBy: new iam.FederatedPrincipal(
                    "cognito-identity.amazonaws.com",
                    {
                        StringEquals: {
                            "cognito-identity.amazonaws.com:aud": identityPool.ref
                        },
                        "ForAnyValue:StringLike": {
                            "cognito-identity.amazonaws.com:amr": "unauthenticated"
                        }
                    },
                    "sts:AssumeRoleWithWebIdentity"
                )
            },
        );

        // Authenticated Role
        const authenticatedRole = new iam.Role(
            this,
            "BalanceTest_Website_Authenticated_Role",
            {
                roleName: "BalanceTest_Website_Authenticated_Role",
                assumedBy: new iam.FederatedPrincipal(
                    "cognito-identity.amazonaws.com",
                    {
                        StringEquals: {
                            "cognito-identity.amazonaws.com:aud": identityPool.ref
                        },
                        "ForAnyValue:StringLike": {
                            "cognito-identity.amazonaws.com:amr": "authenticated"
                        }
                    },
                    "sts:AssumeRoleWithWebIdentity"
                )
            }
        );
        if (authenticatedRole.assumeRolePolicy){
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
        }
        // authenticatedRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSAppSyncInvokeFullAccess'))
        authenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            resources: ['arn:aws:s3:::'+this.region+'/parquet_data/patient_tests/user_id=${cognito-identity.amazonaws.com:sub}/*',
                    'arn:aws:s3:::'+balanceTestBucketName+'/private/${cognito-identity.amazonaws.com:sub}/*'],
        }));
        authenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            resources: [`arn:aws:s3:::${balanceTestBucketName}/*`],
            conditions:{
            'StringEquals':{"aws:PrincipalTag/user_type": "careProvider"}
            }
        }));
        authenticatedRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'athenaManagedPolicy', 'arn:aws:iam::aws:policy/AmazonAthenaFullAccess'));
        authenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "mobileanalytics:PutEvents",
                "cognito-sync:*",
                "cognito-identity:*"
            ],
            resources: ["*"],
        }));

        // Identity Pool Role Attachment
        new cognito.CfnIdentityPoolRoleAttachment(
            this,
            "BalanceTestIdentityPoolRoleAttachment",
            {
                identityPoolId: identityPool.ref,
                roles: {
                    unauthenticated: unauthenticatedRole.roleArn,
                    authenticated: authenticatedRole.roleArn
                }
            }
        );

        // outputs
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId
        });

        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: userPoolClient.ref
        });

        new cdk.CfnOutput(this, 'IdentityPoolId', {
            value: identityPool.ref
        });

        // new cdk.CfnOutput(this, "AuthenticatedRole", {
        //     value: authenticatedRole.roleArn,
        // });

        // new cdk.CfnOutput(this, "UnauthenticatedRole", {
        //     value: unauthenticatedRole.roleArn,
        // });

        new ssm.StringParameter(this, 'CognitoUserPoolId', {
            description: 'Cognito User Pool Id',
            parameterName: 'CognitoUserPoolId',
            stringValue: this.UserPoolId
        }); 

        new ssm.StringParameter(this, 'CognitoUserPoolClientId', {
            description: 'User Pool Client Id',
            parameterName: 'UserPoolClientId',
            stringValue: userPoolClient.ref
        }); 

        new ssm.StringParameter(this, 'CognitoIdentityPoolId', {
            description: 'Identity Pool Id',
            parameterName: 'IdentityPoolId',
            stringValue: identityPool.ref
        }); 

        // new ssm.StringParameter(this, 'CognitoUnauthenticatedRole', {
        //     description: 'Unauthenticated Role',
        //     parameterName: 'UnauthenticatedRole',
        //     stringValue: unauthenticatedRole.roleArn
        // }); 

        // new ssm.StringParameter(this, 'CognitoAuthenticatedRole', {
        //     description: 'Authenticated Role',
        //     parameterName: 'AuthenticatedRole',
        //     stringValue: authenticatedRole.roleArn
        // });     }
    }
}