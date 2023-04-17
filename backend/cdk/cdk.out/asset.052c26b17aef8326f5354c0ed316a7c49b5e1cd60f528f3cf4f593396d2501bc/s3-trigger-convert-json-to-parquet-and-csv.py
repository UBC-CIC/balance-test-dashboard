import json
import urllib.parse
import boto3

import datetime
import io
import os
import pandas as pd

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    sagemaker_runtime = boto3.client('sagemaker-runtime')
    sagemaker = boto3.client('sagemaker')
    
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    
    # Get file from S3 bucket
    try:
        response_get = s3.get_object(Bucket=bucket, Key=key)
        print("Response GET:", response_get)
        
        response_get_body = response_get['Body'].read()
        response_get_body_dict = json.loads(response_get_body)
        response_get_body_str = json.dumps(response_get_body_dict)
        
    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
        raise e
    
    # make Parquet file and folder path 
    df_json = pd.read_json(response_get_body_str)
    user_id = response_get_body_dict['user_id']
    movement_str = response_get_body_dict['movement']
    
    start_date = datetime.datetime.strptime(response_get_body_dict['start_date'], "%Y-%m-%d")
    start_year = start_date.year
    start_month = start_date.month
    start_day = start_date.day
    
    test_event_id = response_get_body_dict['testID']
    training_bool = response_get_body_dict['training']
    
    df_json_select = df_json[['ts', 'ax', 'ay', 'az', 'gx', 'gy', 'gz', 'mx', 'my', 'mz']]
    # df_csv = df_json_select.to_csv(index=False)
    df_parquet = df_json_select.to_parquet(index=False)
    
    # filename_csv = "test_event_" + str(test_event_id) + ".csv"
    filename_parquet = "test_event_" + str(test_event_id) + ".parquet"
    path_general= "parquet_data/patient_tests" + "/user_id=" + str(user_id) + "/movement=" + movement_str + "/year=" + str(start_year) + "/month=" + str(start_month) + "/day=" + str(start_day) + "/test_event_id=" + str(test_event_id) + "/"
    # path_csv = path_general + filename_csv
    path_parquet = path_general + filename_parquet
    # path_parquet_training = "parquet_data/patient_tests" + "/user_id=" + str(user_id) + "/movement=" + movement_str + "/" + filename_parquet
    
    # # Send json file to Sagemaker endpoint
    # print("Key: ", key)
    # dict_to_sagemaker = {'file_path': key}
    # json_to_sagemaker = json.dumps(dict_to_sagemaker).encode('utf-8')
    # print(type(json_to_sagemaker))
    # print(json_to_sagemaker)
    
    if (training_bool == True):
        training_folder_path = os.path.split(key)[0] + "/"; 
        
        try:
            response_list_obj = s3.list_objects_v2(Bucket=bucket, StartAfter=training_folder_path, Prefix=training_folder_path)
            training_object_count = response_list_obj['KeyCount']
            
            if (training_object_count % 10 == 0):
                print("Send for Sagemaker Training Job")
                
            
        except Exception as e:
            print(e)
            print('Error at path {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(training_folder_path, bucket))
            raise e
    
    else:
        print("Send to Sagemaker Endpoint")
    
        # # need another way of sending data to model; try start_pipeline_execution; try modifying endpoint_config in 
        # try:
        #     # need a conditional to check if the data input is for training/testing
            
        #     response_invoke = sagemaker_runtime.invoke_endpoint(EndpointName=os.environ['endpoint_name'], 
        #                                                         ContentType='application/json',
        #                                                         Body=data) # need the endpoint name
            
        #     print("Response, Invoke Endpoint: ", response_invoke)
        #     print(response_invoke['Body'].read())
        
        # except Exception as e:
        #     print(e)
        #     print('Error sending path json to Sagemaker.')
        #     raise(e)
    
    # Put parquet into another S3 folder
    try:
        # if (training == True):
        #     response_put = s3.put_object(Body=df_parquet, Bucket=bucket, Key=path_parquet_training)
        # else:
        #     response_put = s3.put_object(Body=df_parquet, Bucket=bucket, Key=path_parquet)
            
        response_put = s3.put_object(Body=df_parquet, Bucket=bucket, Key=path_parquet)
        print("Response PUT:", response_put)
        
    except Exception as e:
        print(e)
        print('Error putting object {} into bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
        raise e

    
    