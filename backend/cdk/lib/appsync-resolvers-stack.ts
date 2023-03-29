import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from 'aws-cdk-lib';
import { VPCStack } from './vpc-stack';
import { DataWorkflowStack } from './data-workflow-stack';
import { AthenaGlueStack } from './athena-glue-stack';
import { DatabaseStack } from './database-stack';

export class AppsyncStack extends Stack {
    constructor(scope: App, id: string, vpcStack: VPCStack, dataWorkflowStack: DataWorkflowStack, 
                athenaGlueStack: AthenaGlueStack, databaseStack: DatabaseStack, props?: StackProps) {
        super(scope, id, props);

        const generateReportLambdaDataSourceName = "BalanceTest_generate_report_s3_lambda";
        const postgresqlRDSLambdaDataSourceName = "BalanceTest_postgresql_connection_lambda";
        const queryS3LambdaDataSourceName = "BalanceTest_query_s3_lambda";
        const deleteEventLambdaDataSourceName = "BalanceTest_delete_event_record_lambda";

        const generateReportDataSourceRoleName = "BalanceTest-appsync-generateReportDataSource-Role";
        const postgresqlRDSConnectDataSourceRoleName = "BalanceTest-appsync-postgresqlRDSConnectDataSource-Role";
        const queryS3DataSourceRoleName = "BalanceTest-appsync-queryS3DataSource-Role";
        const deleteEventDataSourceRoleName = "BalanceTest-appsync-deleteEventDataSource-Role";
        
    
        //TODO: figure out how to get graphql api from Amplify, and put it in here as part of the inputs
        //TODO: remove the below new api placeholder after figuring out the above. then test deployment
        const api = new appsync.GraphqlApi(this, "BalanceTest-API", {
            name: "BalanceTest-API",
            schema: appsync.SchemaFile.fromAsset("../../../amplify/backend/api/balancetest/schema.graphql"),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.API_KEY, //should be lambda, but will use this for now
                    // lambdaAuthorizerConfig: {
                    //     handler: 
                    // },
                },
            }
        });

        // getting needed Lambda functions for data sources
        const generateReportLambda = dataWorkflowStack.getGenerateReportLambda();
        const postgresqlRDSConnectLambda = databaseStack.getPostgresqlRDSConnectLambda();
        const athenaQueryS3Lambda = athenaGlueStack.getAthenaS3QueryLambda();
        const deleteEventLambda = dataWorkflowStack.getDeleteS3RecordLambda();

        // making IAM roles for data sources
        const generateReportDataSourcePolicyDocument = new iam.PolicyDocument({
            statements: [new iam.PolicyStatement({
            actions: ["lambda:invokeFunction"],
            resources: [generateReportLambda.functionArn]
            })]
        });
        const generateReportDataSourceRole = new iam.Role(this, generateReportDataSourceRoleName, {
            assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
            roleName: generateReportDataSourceRoleName,
            inlinePolicies: { ["BalanceTest-generateReportDataSourcePolicy"]: generateReportDataSourcePolicyDocument }
        });

        const postgresqlRDSConnectDataSourcePolicyDocument = new iam.PolicyDocument({
            statements: [new iam.PolicyStatement({
            actions: ["lambda:invokeFunction"],
            resources: [postgresqlRDSConnectLambda.functionArn]
            })]
        });
        const postgresqlRDSConnectDataSourceRole = new iam.Role(this, postgresqlRDSConnectDataSourceRoleName, {
            assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
            roleName: postgresqlRDSConnectDataSourceRoleName,
            inlinePolicies: { ["BalanceTest-postgresqlRDSConnectDataSourcePolicy"]: postgresqlRDSConnectDataSourcePolicyDocument }
        });

        const queryS3DataSourcePolicyDocument = new iam.PolicyDocument({
            statements: [new iam.PolicyStatement({
            actions: ["lambda:invokeFunction"],
            resources: [athenaQueryS3Lambda.functionArn]
            })]
        });
        const queryS3DataSourceRole = new iam.Role(this, queryS3DataSourceRoleName, {
            assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
            roleName: queryS3DataSourceRoleName,
            inlinePolicies: { ["BalanceTest-queryS3DataSourcePolicy"]: queryS3DataSourcePolicyDocument }
        });

        const deleteEventDataSourcePolicyDocument = new iam.PolicyDocument({
            statements: [new iam.PolicyStatement({
            actions: ["lambda:invokeFunction"],
            resources: [deleteEventLambda.functionArn]
            })]
        });
        const deleteEventDataSourceRole = new iam.Role(this, deleteEventDataSourceRoleName, {
            assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
            roleName: deleteEventDataSourceRoleName,
            inlinePolicies: { ["BalanceTest-deleteEventDataSourcePolicy"]: deleteEventDataSourcePolicyDocument }
        });
        
        //making data sources from the Lambda functions
        const generateReportLambdaDataSource = new appsync.LambdaDataSource(this, generateReportLambdaDataSourceName, {
            api: api,
            lambdaFunction: generateReportLambda,
            name: generateReportLambdaDataSourceName,
            serviceRole: generateReportDataSourceRole
        });

        const postgresqlRDSConnectLambdaDataSource = new appsync.LambdaDataSource(this, postgresqlRDSLambdaDataSourceName, {
            api: api,
            lambdaFunction: postgresqlRDSConnectLambda,
            name: postgresqlRDSLambdaDataSourceName,
            serviceRole: postgresqlRDSConnectDataSourceRole
        });

        const queryS3LambdaDataSource = new appsync.LambdaDataSource(this, queryS3LambdaDataSourceName, {
            api: api,
            lambdaFunction: athenaQueryS3Lambda,
            name: queryS3LambdaDataSourceName,
            serviceRole: queryS3DataSourceRole
        });

        const deleteEventLambdaDataSource = new appsync.LambdaDataSource(this, deleteEventLambdaDataSourceName, {
            api: api,
            lambdaFunction: deleteEventLambda,
            name: deleteEventLambdaDataSourceName,
            serviceRole: deleteEventDataSourceRole
        });

        //TODO: finish making functions
        const s3DownloadAppsyncFunctionName = "redirect_s3_download_function";
        const s3DataRetrievalAppsyncFunctionName = "redirect_s3_data_retrieval_function";
        const postgresqlRDSAppsyncFunctionName = "redirect_postgresql_rds_function";
        const deleteEventAppsyncFunctionName = "redirect_delete_event_function";

        const s3DownloadAppsyncFunction = new appsync.AppsyncFunction(this, s3DownloadAppsyncFunctionName, {
            api: api,
            name: s3DownloadAppsyncFunctionName,
            dataSource: generateReportLambdaDataSource,
            runtime: appsync.FunctionRuntime.JS_1_0_0,
            // code: ,
            // requestMappingTemplate: ,
            // responseMappingTempalte: ,
        });

        const s3DataRetrievalAppsyncFunction = new appsync.AppsyncFunction(this, s3DataRetrievalAppsyncFunctionName, {
            api: api,
            name: s3DataRetrievalAppsyncFunctionName,
            dataSource: queryS3LambdaDataSource,
            runtime: appsync.FunctionRuntime.JS_1_0_0,
            // code: ,
            // requestMappingTemplate: ,
            // responseMappingTempalte: ,
        });

        const postgresqlRDSAppsyncFunction = new appsync.AppsyncFunction(this, postgresqlRDSAppsyncFunctionName, {
            api: api,
            name: postgresqlRDSAppsyncFunctionName,
            dataSource: postgresqlRDSConnectLambdaDataSource,
            runtime: appsync.FunctionRuntime.JS_1_0_0,
            // code: ,
            // requestMappingTemplate: ,
            // responseMappingTempalte: ,
        });
        
        const deleteEventAppsyncFunction = new appsync.AppsyncFunction(this, deleteEventAppsyncFunctionName, {
            api: api,
            name: deleteEventAppsyncFunctionName,
            dataSource: deleteEventLambdaDataSource,
            runtime: appsync.FunctionRuntime.JS_1_0_0,
            // code: ,
            // requestMappingTemplate: ,
            // responseMappingTempalte: ,
        });
        
        // TODO: make the queries
    }
}