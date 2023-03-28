# TODO: fix hardcoded parameters

import boto3
import json

bucket = "json-to-parquet-poc-bucket"
identity_pool_id = 'ca-central-1:966e3d18-034c-451a-a396-e8df41963374'
user_pool_id = 'ca-central-1_qBJ3I7w8V'
region = 'ca-central-1'


athena = boto3.client('athena')
cognito_identity = boto3.client('cognito-identity')


def lambda_handler(event, context):
    print('event')
    print(event)
    # todo: remove hard-coded val
    id_token = event['payload']['authorization']
    # id_token = id_token[id_token.startswith('prefix-') and len('prefix-'):]
    # response = cognito_identity.get_credentials_for_identity(
    #     IdentityId='string',
    #     # Logins={
    #     #     'string': 'string'
    #     # },
    #     # CustomRoleArn='string'
    # )
    # access_key, secret_key, session_token = get_aws_credentials(
    #     identity_pool_id, user_pool_id, jwt_token, region)
    logins = {
        f'cognito-idp.ca-central-1.amazonaws.com/{user_pool_id}': id_token
    }
    print('logins', logins)
    identityId = cognito_identity.get_id(
        IdentityPoolId=identity_pool_id,
        Logins={
            f'cognito-idp.ca-central-1.amazonaws.com/{user_pool_id}': id_token
        }
    )['IdentityId']

    aws_cred = cognito_identity.get_credentials_for_identity(
        IdentityId=identityId,
        Logins={
            f'cognito-idp.ca-central-1.amazonaws.com/{user_pool_id}': id_token
        }
    )['Credentials']
    print('aws_cred', aws_cred)
    s3 = boto3.client('s3', aws_access_key_id=aws_cred['AccessKeyId'],
                      aws_secret_access_key=aws_cred['SecretKey'],
                      aws_session_token=aws_cred['SessionToken'])
    if ('s3key' in event['payload']):
        key = event['payload']['s3key']
        print('key',key)
        measurement = event['payload']['measurement']
        sql = "SELECT ts, "+measurement+" FROM s3object s"
        res = s3.select_object_content(
            Bucket=bucket,
            Key=key,
            ExpressionType='SQL',
            Expression=sql,
            InputSerialization={'Parquet': {}},
            OutputSerialization={'JSON': {}}
        )

        full_records = ''
        # json_list = []
        object_returned = {'ts': [], 'val': []}

        for event in res['Payload']:
            if 'Records' in event:
                records = event['Records']['Payload'].decode('utf-8')
                full_records += records

        records_list = full_records.strip().split('\n')
        for r in records_list:
            json.loads(r)
            # json_list.append(json.loads(r))
            object_returned['ts'].append(json.loads(r)['ts'])
            object_returned['val'].append(json.loads(r)[measurement])

        return {"status": 200, "body": object_returned}
    elif ('athena_query' in event['payload']):
        res1 = athena.start_query_execution(
            QueryString=event['payload']['athena_query'],
            # ClientRequestToken='string',
            QueryExecutionContext={
                'Database': 'sensor_data',
                # 'Catalog': 'string'
            },
            ResultConfiguration={
                'OutputLocation': 's3://json-to-parquet-poc-bucket/athena_results/',
                'EncryptionConfiguration': {
                    'EncryptionOption': 'SSE_S3'
                    # 'KmsKey': 'string'
                },
                # 'ExpectedBucketOwner': 'string',
                # 'AclConfiguration': {
                #     'S3AclOption': 'BUCKET_OWNER_FULL_CONTROL'
                # }
            },
            # WorkGroup='string',
            # ExecutionParameters=[
            # 'string',
            # ],
            # ResultReuseConfiguration={
            #     'ResultReuseByAgeConfiguration': {
            #         'Enabled': True,
            #         # 'MaxAgeInMinutes': 123
            #     }
            # }
        )
        print('res1')
        print(res1)
        query_status = athena.get_query_execution(
            QueryExecutionId=res1['QueryExecutionId']
        )['QueryExecution']['Status']['State']
        print('query_status', query_status)
        while (query_status == 'RUNNING' or query_status == 'QUEUED'):
            print('79')
            print('query_status', query_status)
            query_status = athena.get_query_execution(
                QueryExecutionId=res1['QueryExecutionId']
            )['QueryExecution']['Status']['State']
        print('83')
        print('query_status', query_status)

        # res2 = client.get_query_execution(
        #     QueryExecutionId=res1['QueryExecutionId']
        # )['QueryExecution']
        # print('res2', res2)
        if query_status == 'SUCCEEDED':
            print('84')
            results = athena.get_query_results(
                QueryExecutionId=res1['QueryExecutionId'])

            # print('results', results)
            return_result = {}
            col_names = [item['VarCharValue']
                         for item in results['ResultSet']['Rows'][0]['Data']]
            for i in range(len(results['ResultSet']['Rows'])):
                row = results['ResultSet']['Rows'][i]
                if (i == 0):
                    continue
                # print(row['Data'])
                for j, item in enumerate(row['Data']):
                    if (i == 1):
                        return_result[col_names[j]] = []
                    # print('return_result',return_result)
                    for k, v in item.items():
                        return_result[col_names[j]].append(v)
            # for row in results['ResultSet']['Rows']:
            #     print(row['Data'])
            #     for j, item in enumerate(row['Data']):
            #         return_result.append({col_names[j]: []})
            #         for k, v in item.items():
            #             return_result[j][col_names[j]].append(v)
            print('return_result', return_result)
            return {'status': 200, 'body': return_result}

        else:
            res2 = athena.get_query_execution(
                QueryExecutionId=res1['QueryExecutionId']
            )['QueryExecution']
            print('res2', res2)

        # print(res2)
        # s3key = res2['QueryExecution']['ResultConfiguration']['OutputLocation']
        # print('s3key', s3key)
        # while
        # res3 = s3_client.select_object_content(
        #     Bucket=bucket,
        #     Key=s3key.replace('s3://'+bucket+'/', '', 1),
        #     ExpressionType='SQL',
        #     Expression='select * from s3object s',
        #     InputSerialization={'CSV': {}},
        #     OutputSerialization={'JSON': {}}
        # )
        # print('res3', res3)
