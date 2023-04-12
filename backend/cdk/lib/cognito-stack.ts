import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';
import { VPCStack } from './vpc-stack';
import { DataWorkflowStack } from './data-workflow-stack';
import { AthenaGlueStack } from './athena-glue-stack';
import { DatabaseStack } from './database-stack';
import * as console from "console";

export class CognitoStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const lambdaRole = new iam.Role(this, 'HealthPlatformCognitoLambdaRole', {
            roleName: 'HealthPlatformCognitoLambdaRole',
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                additional: new PolicyDocument({
                        statements: [
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            actions: [
                                // DynamoDB
                                'dynamodb:Scan',
                                'dynamodb:GetItem',
                                'dynamodb:PutItem',
                                'dynamodb:Query',
                                'dynamodb:UpdateItem',
                                'dynamodb:DeleteItem',
                                'dynamodb:BatchWriteItem',
                                'dynamodb:BatchGetItem',
                                // Lambda
                                'lambda:InvokeFunction',
                                // CloudWatch
                                'cloudwatch:*',
                                'logs:*',
                                //SSM
                                'ssm:*',
                            ],
                            resources: ['*']
                        })
                    ]
                }),
            },
        });

        const createPatientsDetailFunction = new lambda.Function(this, 'CreatePatientsDetailFunction', {
            functionName: "Patients-Detail-Create",
            code: new lambda.AssetCode('build/src'),
            handler: 'patients-detail-create.handler',
            runtime: lambda.Runtime.NODEJS_12_X,
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            role: lambdaRole,
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
                'joinedOn': new DateTimeAttribute(),
            },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            lambdaTriggers: {
                postConfirmation: createPatientsDetailFunction,
            }
        });
        this.UserPoolId = userPool.userPoolId;

        // User Pool Client
        const userPoolClient = new CfnUserPoolClient(this, 'HealthPlatformUserPoolClient', {
            clientName: 'HealthPlatformUserPoolClient',
            userPoolId: userPool.userPoolId,
            explicitAuthFlows: [
                "ALLOW_USER_SRP_AUTH",
                "ALLOW_REFRESH_TOKEN_AUTH"
            ]
        });

        // Identity Pool
        const identityPool = new CfnIdentityPool(this, 'HealthPlatformIdentityPool', {
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [{
                clientId: userPoolClient.ref,
                providerName: userPool.userPoolProviderName
            }]
        });

        // Unauthenticated Role
        const unauthenticatedRole = new Role(
            this,
            "HealthPlatform_Website_Unauthenticated_Role",
            {
                roleName: "HealthPlatform_Website_Unauthenticated_Role",
                assumedBy: new FederatedPrincipal(
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
        const authenticatedRole = new Role(
            this,
            "HealthPlatform_Website_Authenticated_Role",
            {
                roleName: "HealthPlatform_Website_Authenticated_Role",
                assumedBy: new FederatedPrincipal(
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
        authenticatedRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSAppSyncInvokeFullAccess'))

        // Identity Pool Role Attachment
        new CfnIdentityPoolRoleAttachment(
            this,
            "HealthPlatformIdentityPoolRoleAttachment",
            {
                identityPoolId: identityPool.ref,
                roles: {
                    unauthenticated: unauthenticatedRole.roleArn,
                    authenticated: authenticatedRole.roleArn
                }
            }
        );

        // outputs
        new CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId
        });

        new CfnOutput(this, 'UserPoolClientId', {
            value: userPoolClient.ref
        });

        new CfnOutput(this, 'IdentityPoolId', {
            value: identityPool.ref
        });

        new CfnOutput(this, "AuthenticatedRole", {
            value: authenticatedRole.roleArn,
        });

        new CfnOutput(this, "UnauthenticatedRole", {
            value: unauthenticatedRole.roleArn,
        });

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

        new ssm.StringParameter(this, 'CognitoUnauthenticatedRole', {
            description: 'Unauthenticated Role',
            parameterName: 'UnauthenticatedRole',
            stringValue: unauthenticatedRole.roleArn
        }); 

        new ssm.StringParameter(this, 'CognitoAuthenticatedRole', {
            description: 'Authenticated Role',
            parameterName: 'AuthenticatedRole',
            stringValue: authenticatedRole.roleArn
        });     }
}