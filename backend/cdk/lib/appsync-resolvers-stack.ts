import { App, Duration, RemovalPolicy, Stack, StackProps, triggers } from 'aws-cdk-lib';
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cdk from 'aws-cdk-lib';
import { VPCStack } from './vpc-stack';
import { DataWorkflowStack } from './data-workflow-stack';
import { AthenaGlueStack } from './athena-glue-stack';
import { DatabaseStack } from './database-stack';
import * as console from "console";

export class AppsyncStack extends Stack {
    constructor(scope: App, id: string, vpcStack: VPCStack, dataWorkflowStack: DataWorkflowStack, 
                athenaGlueStack: AthenaGlueStack, databaseStack: DatabaseStack, props?: StackProps) {
        super(scope, id, props);

        const appsyncName = "BalanceTest-API";

        const generateReportLambdaDataSourceName = "BalanceTest_generate_report_s3_lambda";
        const postgresqlRDSLambdaDataSourceName = "BalanceTest_postgresql_connection_lambda";
        const queryS3LambdaDataSourceName = "BalanceTest_query_s3_lambda";
        const deleteEventLambdaDataSourceName = "BalanceTest_delete_event_record_lambda";

        const generateReportDataSourceRoleName = "BalanceTest-appsync-generateReportDataSource-Role";
        const postgresqlRDSConnectDataSourceRoleName = "BalanceTest-appsync-postgresqlRDSConnectDataSource-Role";
        const queryS3DataSourceRoleName = "BalanceTest-appsync-queryS3DataSource-Role";
        const deleteEventDataSourceRoleName = "BalanceTest-appsync-deleteEventDataSource-Role";
        
        // getting GraphQL API ID from Parameter Store
        const apiId = ssm.StringParameter.fromStringParameterAttributes(this, "BalanceTestAppsyncApiId", {
            parameterName: "GraphqlApiId",
        }).stringValue;

        const api = appsync.GraphqlApi.fromGraphqlApiAttributes(this, appsyncName, {
            graphqlApiId: apiId
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

        // make Appsync Functions
        const s3DownloadAppsyncFunctionName = "redirect_s3_download_function";
        const s3DataRetrievalAppsyncFunctionName = "redirect_s3_data_retrieval_function";
        const postgresqlRDSAppsyncFunctionName = "redirect_postgresql_rds_function";
        const deleteEventAppsyncFunctionName = "redirect_delete_event_function";

        const s3DownloadAppsyncFunction = new appsync.AppsyncFunction(this, s3DownloadAppsyncFunctionName, {
            api: api,
            name: s3DownloadAppsyncFunctionName,
            dataSource: generateReportLambdaDataSource,
            runtime: appsync.FunctionRuntime.JS_1_0_0,
            code: appsync.Code.fromAsset('appsync/AppsyncFunctions/redirect_s3_download_function.js'),
        });

        const s3DataRetrievalAppsyncFunction = new appsync.AppsyncFunction(this, s3DataRetrievalAppsyncFunctionName, {
            api: api,
            name: s3DataRetrievalAppsyncFunctionName,
            dataSource: queryS3LambdaDataSource,
            runtime: appsync.FunctionRuntime.JS_1_0_0,
            code: appsync.Code.fromAsset('appsync/AppsyncFunctions/redirect_s3_data_retrieval_function.js'),
        });

        const postgresqlRDSAppsyncFunction = new appsync.AppsyncFunction(this, postgresqlRDSAppsyncFunctionName, {
            api: api,
            name: postgresqlRDSAppsyncFunctionName,
            dataSource: postgresqlRDSConnectLambdaDataSource,
            runtime: appsync.FunctionRuntime.JS_1_0_0,
            code: appsync.Code.fromAsset('appsync/AppsyncFunctions/redirect_postgresql_rds_function.js'),
        });
        
        const deleteEventAppsyncFunction = new appsync.AppsyncFunction(this, deleteEventAppsyncFunctionName, {
            api: api,
            name: deleteEventAppsyncFunctionName,
            dataSource: deleteEventLambdaDataSource,
            runtime: appsync.FunctionRuntime.JS_1_0_0,
            code: appsync.Code.fromAsset('appsync/AppsyncFunctions/redirect_delete_event_function.js'),
        });
        
        // make resolvers by looping through each list and getting the associated code
        let deleteEventResolverNameList = ["deleteTestEventFromS3"];
        let s3DownloadResolverNameList = ["downloadTestEventDetails"];
        let s3DataRetrievalResolverNameList = ['getMeasurementRange','getMeasurementData'];

        let postgresqlRDSQueryResolverNameList = ['getAllAvailableTests', 'getAllPatients', "getCareproviderById", 'getPatientAssignedTests', 'getPatientById', 'getPatientsForCareprovider', 'getScoreStatsOverTime', 'getTestEventById', 'getTestEvents'];
        let postgresqlRDSMutationResolverNameList = ['addPatientToCareProvider', 'addTestType', 'assignTestToPatient', 'createCareProvider', 'createPatient', 'deleteTestEventFromDB', 'putBalanceScore', 'putTestResult', 'recordConsentDate', 'removeTestFromPatient'];

        for (let i = 0; i < deleteEventResolverNameList.length; i++) {
            let deleteEventResolver = new appsync.Resolver(this, deleteEventResolverNameList[i], {
                api: api,
                fieldName: deleteEventResolverNameList[i],
                typeName: "Mutation",
                runtime: appsync.FunctionRuntime.JS_1_0_0,
                code: appsync.Code.fromAsset('appsync/resolverMappingFunctions/' + deleteEventResolverNameList[i] + ".js"),
                pipelineConfig: [deleteEventAppsyncFunction],
            });
        }

        for (let i = 0; i < s3DownloadResolverNameList.length; i++) {
            let s3DownloadResolver = new appsync.Resolver(this, s3DownloadResolverNameList[i], {
                api: api,
                fieldName: s3DownloadResolverNameList[i],
                typeName: "Query",
                runtime: appsync.FunctionRuntime.JS_1_0_0,
                code: appsync.Code.fromAsset('appsync/resolverMappingFunctions/' + s3DownloadResolverNameList[i] + ".js"),
                pipelineConfig: [s3DownloadAppsyncFunction],
            });
        }

        for (let i = 0; i < s3DataRetrievalResolverNameList.length; i++) {
            let s3DataRetrievalResolver = new appsync.Resolver(this, s3DataRetrievalResolverNameList[i], {
                api: api,
                fieldName: s3DataRetrievalResolverNameList[i],
                typeName: "Query",
                runtime: appsync.FunctionRuntime.JS_1_0_0,
                code: appsync.Code.fromAsset('appsync/resolverMappingFunctions/' + s3DataRetrievalResolverNameList[i] + ".js"),
                pipelineConfig: [s3DataRetrievalAppsyncFunction],
            });
        }

        for (let i = 0; i < postgresqlRDSQueryResolverNameList.length; i++) {
            let postgresqlRDSQueryResolver = new appsync.Resolver(this, postgresqlRDSQueryResolverNameList[i], {
                api: api,
                fieldName: postgresqlRDSQueryResolverNameList[i],
                typeName: "Query",
                runtime: appsync.FunctionRuntime.JS_1_0_0,
                code: appsync.Code.fromAsset('appsync/resolverMappingFunctions/' + postgresqlRDSQueryResolverNameList[i] + ".js"),
                pipelineConfig: [postgresqlRDSAppsyncFunction],
            });
        }

        for (let i = 0; i < postgresqlRDSMutationResolverNameList.length; i++) {
            let postgresqlRDSMutationResolver = new appsync.Resolver(this, postgresqlRDSMutationResolverNameList[i], {
                api: api,
                fieldName: postgresqlRDSMutationResolverNameList[i],
                typeName: "Mutation",
                runtime: appsync.FunctionRuntime.JS_1_0_0,
                code: appsync.Code.fromAsset('appsync/resolverMappingFunctions/' + postgresqlRDSMutationResolverNameList[i] + ".js"),
                pipelineConfig: [postgresqlRDSAppsyncFunction],
            });
        }
    }
}