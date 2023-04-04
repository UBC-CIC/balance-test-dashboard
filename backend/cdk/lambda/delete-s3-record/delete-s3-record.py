import boto3
import json
import os

bucket = os.environ["S3_BUCKET_NAME"]
identity_pool_id = os.environ["IDENTITY_POOL_ID"]
user_pool_id = os.environ["USER_POOL_ID"]
region = os.environ["REGION"]


cognito_identity = boto3.client('cognito-identity')


def lambda_handler(event, context):
    # print('event')
    # print(event)
    # todo: remove hard-coded val
    id_token = event['payload']['authorization']
    logins = {
        f'cognito-idp.{region}.amazonaws.com/{user_pool_id}': id_token
    }
    # print('logins', logins)
    identityId = cognito_identity.get_id(
        IdentityPoolId=identity_pool_id,
        Logins={
            f'cognito-idp.{region}.amazonaws.com/{user_pool_id}': id_token
        }
    )['IdentityId']

    aws_cred = cognito_identity.get_credentials_for_identity(
        IdentityId=identityId,
        Logins={
            f'cognito-idp.{region}.amazonaws.com/{user_pool_id}': id_token
        }
    )['Credentials']

    s3 = boto3.client('s3', aws_access_key_id=aws_cred['AccessKeyId'],
                      aws_secret_access_key=aws_cred['SecretKey'],
                      aws_session_token=aws_cred['SessionToken'])
    if ('pathToJson' in event['payload']):
        jsonToDelete = event['payload']['pathToJson']
        parquetToDelete = event['payload']['pathToParquet']

        # print('jsonToDelete', jsonToDelete)
        # print('parquetToDelete', parquetToDelete)

        try:
            deleteJsonResponse = s3.delete_object(
                Bucket=bucket,
                Key=jsonToDelete
            )
            # print('deleteJsonResponse', deleteJsonResponse)
            deleteParquetResponse = s3.delete_object(
                Bucket=bucket,
                Key=parquetToDelete
            )
            # print('deleteParquetResponse', deleteParquetResponse)
            return {'status': 200, 'body': 'delete success'}

        except Exception as e:
            return {"status": 400, "body": e}
