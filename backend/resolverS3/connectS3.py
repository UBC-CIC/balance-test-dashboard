import boto3
import json

bucket = "json-to-parquet-poc-bucket"

s3_client = boto3.client('s3')


def lambda_handler(event, context):
    print('event')
    print(event)
    key = event['payload']['s3key']
    measurement = event['payload']['measurement']
    sql = "SELECT ts, "+measurement+" FROM s3object s"
    res = s3_client.select_object_content(
        Bucket=bucket,
        Key=key,
        ExpressionType='SQL',
        Expression=sql,
        InputSerialization={'Parquet': {}},
        OutputSerialization={'JSON': {}}
    )

    full_records = ''
    json_list = []

    for event in res['Payload']:
        if 'Records' in event:
            records = event['Records']['Payload'].decode('utf-8')
            full_records += records

    records_list = full_records.strip().split('\n')
    for r in records_list:
        json.loads(r)
        json_list.append(json.loads(r))

    return {"status": 200, "body": json_list}
