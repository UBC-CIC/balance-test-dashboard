import json
import urllib.parse
import boto3
from botocore.config import Config

import datetime
from heapq import nlargest
from heapq import nsmallest
import io
import numpy as np
import os
import pandas as pd
import psycopg2
from sagemaker.serializers import JSONSerializer
from sagemaker.deserializers import JSONDeserializer
from sagemaker.tensorflow import TensorFlow
from sagemaker import get_execution_role
from scipy.signal import stft


config = Config(
    read_timeout=70,
    retries={
        'max_attempts': 1
    }
)

s3 = boto3.client('s3')
ssm = boto3.client('ssm')
sagemaker_runtime = boto3.client('sagemaker-runtime', config=config)
sagemaker = boto3.client('sagemaker')


def lambda_handler(event, context):

    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(
        event['Records'][0]['s3']['object']['key'], encoding='utf-8')

    # Get file from S3 bucket
    response_get_body_dict = get_object_from_s3(bucket, key)
    response_get_body_str = json.dumps(response_get_body_dict)

    # make Dataframe from json data and make folder path
    df_json = pd.read_json(response_get_body_str)
    region = event['Records'][0]['awsRegion']
    user_id = response_get_body_dict['user_id']
    movement_str = response_get_body_dict['movement']

    start_date = datetime.datetime.strptime(
        response_get_body_dict['start_date'], "%Y-%m-%d")
    start_year = start_date.year
    start_month = start_date.month
    start_day = start_date.day

    test_event_id = response_get_body_dict['testID']
    training_bool = response_get_body_dict['training']

    df_json_select = df_json[['ts', 'ax', 'ay',
                              'az', 'gx', 'gy', 'gz', 'mx', 'my', 'mz']]

    path_general = "parquet_data/patient_tests" + "/user_id=" + region + ":" + str(user_id) + "/movement=" + movement_str + "/year=" + str(
        start_year) + "/month=" + str(start_month) + "/day=" + str(start_day) + "/test_event_id=" + str(test_event_id) + "/"
    # TODO: uncomment if file conversion is in this lambda
    convert_json_to_parquet(df_json_select, bucket,
                            path_general, test_event_id)

    # endpoint_parameter_name = os.environ["endpoint_name"] #TODO: uncomment this after testing
    endpoint_parameter_value = ''
    endpoint_exists_bool = False
    # sagemaker_bucket = os.environ["sagemaker_bucket_name"]

    # TODO: remove the below testing lines
    endpoint_parameter_name = "/cdk-bootstrap/hnb659fds/version"

    try:
        # Get list of parameters from Parameter Store to compare
        print("Getting list of parameters.")
        response_describe_param = ssm.describe_parameters()
        print("Response, describe parameters:", response_describe_param)
        parameters = response_describe_param['Parameters']
        print("Finished getting list of parameters.")

        # If endpoint name is already created, then get the value for the endpoint name
        if len(parameters) != 0:
            for param in parameters:
                if (param['Name'] == endpoint_parameter_name):
                    response_get_param = ssm.get_parameter(
                        Name=endpoint_parameter_name)
                    endpoint_parameter_value = response_get_param['Parameter']["Value"]
                    endpoint_exists_bool = True
                    print("Endpoint name parameter does exist in Parameter Store.")
                    break

        # print("Endpoint Parameter Value: ", endpoint_parameter_value)

    except Exception as e:
        print(e)
        print("Error with getting values from Parameter Store.")
        raise e

    if (endpoint_exists_bool == False):
        print("Make new endpoint by starting a training job.")

    elif (training_bool == True and endpoint_exists_bool == True):  # TODO: change to True after testing
        print("Endpoint exists; checking if model training requirement is satisfied.")
        training_folder_path = os.path.split(key)[0] + "/"

        # list the training files in the training folder, get the data, and send them to a training job
        try:
            response_list_obj = s3.list_objects_v2(
                Bucket=bucket, StartAfter=training_folder_path, Prefix=training_folder_path)
            training_object_count = response_list_obj['KeyCount']

            if (training_object_count % 10 == 0 and training_object_count >= 10):
                print("Send for Sagemaker Training Job")

        #         list_of_obj = response_list_obj['Contents'][-10:]
        #         list_of_training_data = []
        #         list_of_paths = []

        #         for i in range(0, len(list_of_obj)):
        #             key_to_append = bucket + '/' + list_of_obj[i]['Key']
        #             list_of_paths.append(key_to_append)
        # #             list_of_paths.append(f's3://{key_to_append}')
        # #             response_s3_data_dict = get_object_from_s3(bucket, list_of_obj[i]['Key'])
        # #             response_s3_data_str = json.dumps(response_s3_data_dict)
        # #             list_of_training_data.append(response_s3_data_str)

        # #         print(list_of_training_data)
        # #         print("Length of list with training data:", len(list_of_training_data))
        #         print(list_of_paths)
                # print("Length of list with training data:", len(list_of_paths))

                # TODO: modify the below lines for training
                # tf_estimator = launch_training_job(bucket, training_folder_path)

            else:
                print("Not enough training recordings yet.")

        except Exception as e:
            print(e)
            print('Error at path {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(
                training_folder_path, bucket))
            raise e

    else:
        print("Send to Sagemaker Endpoint")

        try:
            # TODO: remove after testing
            endpoint_parameter_value = os.environ['endpoint_name']
            # TODO: remove the line below after testing, and uncomment the line after
            target_model_name = 'p1'
            # target_model_name = user_id

            preprocessedArr = preprocess_data(response_get_body_dict)
            invokeEndpointInput = {"instances": preprocessedArr}

            serializer = JSONSerializer()
            invokeEndpointInput = serializer.serialize(invokeEndpointInput)

            # TODO: change the endpoint name to endpoint_parameter_value (whatever is in Parameter Store), and figure out how to get the name from TargetModel from saved_models folder in S3
            response_invoke = sagemaker_runtime.invoke_endpoint(EndpointName=endpoint_parameter_value,
                                                                ContentType='application/json',
                                                                TargetModel=target_model_name + ".tar.gz",
                                                                Body=invokeEndpointInput)  # need the endpoint name and target model tar

            print("Response, Invoke Endpoint: ", response_invoke)

            data_body = response_invoke['Body'].read()
            data = json.loads(data_body)

            send_data_to_rds(data, user_id, test_event_id)

        except Exception as e:
            print(e)
            print('Error invoking Sagemaker endpoint or saving to database.')
            raise (e)


"""
This function gets a file from the S3 bucket based on the key, and returns a dictionary with the data.

bucket: the string representing the bucket name
key: the string representing the path to get the file from the S3 bucket

Returns - a dictionary representing the data from the file (json)
"""


def get_object_from_s3(bucket, key):

    try:
        response_get = s3.get_object(Bucket=bucket, Key=key)
        print("Response, Get From S3 Bucket:", response_get)

        response_get_body = response_get['Body'].read()
        response_get_body_dict = json.loads(response_get_body)
        # response_get_body_str = json.dumps(response_get_body_dict)
        # print(response_get_body_str)

        return response_get_body_dict

    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
        raise e


"""
This functions takes a Pandas Dataframe, makes parquet file from it, and puts it into the specified bucket name at the specified path string

dataframe: a Pandas Dataframe to convert to a parquet file
bucket: the string representing the bucket name
output_s3_path: the string representing the path to the folder for storing in the bucket
test_event_id: the string representing the test event id
"""


def convert_json_to_parquet(dataframe, bucket, output_s3_path, test_event_id):
    df_parquet = dataframe.to_parquet(index=False)

    filename_parquet = "test_event_" + str(test_event_id) + ".parquet"
    path_parquet = output_s3_path + filename_parquet

    try:
        response_put = s3.put_object(
            Body=df_parquet, Bucket=bucket, Key=path_parquet)
        print("Response, Put in S3 Bucket:", response_put)

    except Exception as e:
        print(e)
        print('In file format conversion function. Error putting object into bucket {}. Make sure the object exists and your bucket is in the same region as this function.'.format(bucket))
        raise e


"""

"""


def check_training_requirement_and_make_training_job():
    print("Check training requirement and make training job.")


"""
This function turns a Pandas Dataframe into the appropriate size and shape, while also doing other
pre-processing functionalities.

df: a Pandas Dataframe containing the accelerometer, gyroscope, and magnetometer columns

Returns - a NumPy array containing the modified data from df
"""
# TODO: see if we need to change pad_length, and add in magnetometer


def preprocess_data(df):

    pad_length = (2000-len(df['ax']))//2
    print("Pad Length: ", pad_length)

    ax_normal_stft = np.abs(stft(np.pad(
        df['ax'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)
    ay_normal_stft = np.abs(stft(np.pad(
        df['ay'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)
    az_normal_stft = np.abs(stft(np.pad(
        df['az'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)

    ax_normal_stft_largest = nlargest(50, ax_normal_stft.flatten())
    ax_normal_stft_smallest = nsmallest(50, ax_normal_stft.flatten())
    ay_normal_stft_largest = nlargest(50, ay_normal_stft.flatten())
    ay_normal_stft_smallest = nsmallest(50, ay_normal_stft.flatten())
    az_normal_stft_largest = nlargest(50, az_normal_stft.flatten())
    az_normal_stft_smallest = nsmallest(50, az_normal_stft.flatten())

    gx_normal_stft = np.abs(stft(np.pad(
        df['gx'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)
    gy_normal_stft = np.abs(stft(np.pad(
        df['gy'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)
    gz_normal_stft = np.abs(stft(np.pad(
        df['gz'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)

    gx_normal_stft_largest = nlargest(50, gx_normal_stft.flatten())
    gx_normal_stft_smallest = nsmallest(50, gx_normal_stft.flatten())
    gy_normal_stft_largest = nlargest(50, gy_normal_stft.flatten())
    gy_normal_stft_smallest = nsmallest(50, gy_normal_stft.flatten())
    gz_normal_stft_largest = nlargest(50, gz_normal_stft.flatten())
    gz_normal_stft_smallest = nsmallest(50, gz_normal_stft.flatten())

    data = [*ax_normal_stft_largest, *ax_normal_stft_smallest, *ay_normal_stft_largest, *ay_normal_stft_smallest, *az_normal_stft_largest, *az_normal_stft_smallest,
            *gx_normal_stft_largest, *gx_normal_stft_smallest, *gy_normal_stft_largest, *gy_normal_stft_smallest, *gz_normal_stft_largest, *gz_normal_stft_smallest]

    X = np.array(data)
    print("X shape: ", len(X))

    X = np.reshape(X, (1, 1, X.shape[0]))
    print("Post-processing shape: ", X.shape)

    return X


"""
This function creates a Sagemaker training job. 

bucket: a string representing the bucket name for the training folder
training_folder_key: a string representing the training folder path within the bucket

Returns - a TensorFlow estimator from Sagemaker
"""


def launch_training_job(bucket, training_folder_key):

    try:
        role = get_execution_role()

    except Exception as e:
        print(e)
        print("Cannot get execution role for Sagemaker training job.")
        raise e

    # TODO: add an environment variable with the arn for role
    tf_estimator = TensorFlow(
        entry_point="LSTM.py",  # training script name
        source_dir='code',  # training script source directory on your notebook
        model_dir=f'/opt/ml/model',
        role=role,
        instance_count=1,
        instance_type="ml.g4dn.8xlarge",  # training instance
        framework_version="2.4",  # tensorflow version
        py_version="py37",  # python version
    )

    tf_estimator.fit(f's3://{bucket}/{training_folder_key}')

    return tf_estimator


"""
This function takes the necessary ML output data, and updates the database's specified test event with that data.

data: a dictionary representing the output from the ML model
user_id: the string representing the patient id in the database
test_event_id: the string representing the test event id in the database
"""


def send_data_to_rds(data, user_id, test_event_id):

    secrets_manager_client = boto3.client("secretsmanager")

    try:
        response = secrets_manager_client.get_secret_value(SecretId=os.environ["rds_secret_name"])[
            "SecretString"]  # TODO: add the secret id when deploying
        secret = json.loads(response)
        print("Retrieved secret for database.")

    except Exception as e:
        print(e)
        print("Error getting the RDS secret from Secrets Manager.")
        raise e

    # TODO: see if we want environment variables for host
    try:
        rds_pg_connection = psycopg2.connect(
            user=secret["username"],
            password=secret["password"],
            host=os.environ["host"],
            dbname=os.environ["dbname"]
        )
        print("Successfully connected to database.")

    except Exception as e:
        print(e)
        print("Error with connecting to RDS.")
        raise (e)

    cursor = rds_pg_connection.cursor()
    print("Made cursor.")

    # to change from a decimal to a percentage
    score = data["predictions"][0][0] * 100
    print("Score to add to database:", score)

    query = 'UPDATE "TestEvent" SET balance_score = %s WHERE test_event_id = %s AND patient_id = %s'
    cursor.execute(query, vars=(score, test_event_id, user_id))

    rds_pg_connection.commit()
    print("Updated data for the test event in the database.")

    # # TODO: remove after testing
    query = 'SELECT * FROM "TestEvent" WHERE test_event_id = %s AND patient_id = %s'
    cursor.execute(query, vars=(test_event_id, user_id))
    for record in cursor:
        print("Cursor record:", record)

    cursor.close()
    rds_pg_connection.close()
    print("Closed database connection.")
