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
from sagemaker.tensorflow.serving import TensorFlowModel
from sagemaker.multidatamodel import MultiDataModel
from sagemaker import get_execution_role
from sagemaker import Session
from scipy.signal import stft


s3 = boto3.client('s3')
ssm = boto3.client('ssm')
sagemaker = boto3.client('sagemaker')


def lambda_handler(event, context):
    
    # config = Config(
    #     read_timeout=70,
    #     retries={
    #         'max_attempts': 1
    #     }
    # )
    sagemaker_runtime = boto3.client('sagemaker-runtime')#, config=config)

    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')

    # Get file from S3 bucket
    response_get_body_dict = get_object_from_s3(bucket, key)
    response_get_body_str = json.dumps(response_get_body_dict)

    # make Dataframe from json data and make folder path
    df_json = pd.read_json(response_get_body_str)
    region = event['Records'][0]['awsRegion']
    user_id = response_get_body_dict['user_id']
    movement_str = response_get_body_dict['movement']

    start_date = datetime.datetime.strptime(response_get_body_dict['start_date'], "%Y-%m-%d")
    start_year = start_date.year
    start_month = start_date.month
    start_day = start_date.day

    test_event_id = response_get_body_dict['testID']
    training_bool = response_get_body_dict['training']

    df_json_select = df_json[['ts', 'ax', 'ay', 'az', 'gx', 'gy', 'gz', 'mx', 'my', 'mz']]

    path_general = "parquet_data/patient_tests" + "/user_id=" + region + ":" + str(user_id) + "/movement=" + movement_str + "/year=" + str(start_year) + "/month=" + str(start_month) + "/day=" + str(start_day) + "/test_event_id=" + str(test_event_id) + "/"
    convert_json_to_parquet(df_json_select, bucket, path_general, test_event_id)

    endpoint_parameter_name = os.environ["endpoint_parameter_name"] #TODO: change this to endpoint_parameter_name
    endpoint_parameter_value = ''
    endpoint_exists_bool = False
    sagemaker_bucket = os.environ["sagemaker_bucket_name"]

    # TODO: remove the below testing lines
    # endpoint_parameter_name = "/cdk-bootstrap/hnb659fds/version"

    try:
        # Get list of parameters from Parameter Store to compare
        print("Getting list of parameters.")
        response_describe_param = ssm.describe_parameters()
        print("Got response, describe parameters")
        parameters = response_describe_param['Parameters']
        print("Finished getting list of parameters.")

        # If endpoint parameter is already created, then get the value for the endpoint name and compare
        if len(parameters) != 0:
            for param in parameters:
                if (param['Name'] == endpoint_parameter_name):
                    response_get_param = ssm.get_parameter(Name=endpoint_parameter_name)
                    endpoint_parameter_value = response_get_param['Parameter']["Value"]
                    
                    if (endpoint_parameter_value == os.environ["endpoint_name"]):
                        endpoint_exists_bool = True
                        print("Correct endpoint value does exist in Parameter Store.")
                        
                    else: 
                        endpoint_exists_bool = False
                        print("Endpoint value does not exist in Parameter Store. Parameter:", endpoint_parameter_value, os.environ["endpoint_name"])
                    
                    break

    except Exception as e:
        print(e)
        print("Error with getting values from Parameter Store.")
        raise e

    # Setting where the models and training job outputs should be saved
    model_location_prefix_key = f'saved_models/movement={movement_str}'
    training_job_location_prefix_s3_uri = f's3://{sagemaker_bucket}/training_job_outputs/movement={movement_str}' # TODO: add a Sagemaker bucket; change the bucket argument

    # Checking if an endpoint exists, and whether to make a training job or invoke an endpoint
    if (endpoint_exists_bool == False):
        print("Make new endpoint by starting a training job.")

        training_folder_path = os.path.split(key)[0] + "/"

        if (training_bool == True):
            make_training_job_and_endpoint(bucket, training_folder_path, model_location_prefix_key, training_job_location_prefix_s3_uri, user_id, endpoint_parameter_name)

        else:
            print("Need to send in a number of recordings with provided scores before testing with an actual model.")

    elif (training_bool == True and endpoint_exists_bool == True):  # TODO: change to True after testing
        print("Endpoint exists; checking if model training requirement is satisfied.")

        training_folder_path = os.path.split(key)[0] + "/"

        make_training_job_and_add_model(bucket, training_folder_path, model_location_prefix_key, training_job_location_prefix_s3_uri, user_id)

    else:
        print("Sending to Sagemaker Endpoint")

        try:
            # TODO: remove after testing
            # endpoint_parameter_value = os.environ['endpoint_name']
            # TODO: remove the line below after testing, and uncomment the line after
            # target_model_name = 'p1' + '.tar.gz'
            # target_model_name = user_id

            model_location_prefix_key = f'{model_location_prefix_key}/user_id={user_id}'

            preprocessedArr = preprocess_data(response_get_body_dict)
            invokeEndpointInput = {"instances": preprocessedArr}

            serializer = JSONSerializer()
            invokeEndpointInput = serializer.serialize(invokeEndpointInput)

            # TODO: add a Sagemaker bucket; change the bucket argument
            # to get the most recent TargetModel for the user
            try:
                print("Getting a list of the user's model files in the S3 bucket.")
                response_list_obj = s3.list_objects_v2(Bucket=sagemaker_bucket, StartAfter=model_location_prefix_key, Prefix=model_location_prefix_key)
                target_model_key = response_list_obj['Contents'][-1]['Key'] # gets the last key in the list
                
                index = target_model_key.find("/user_id=") # this is the part after the movement subfolder
                target_model_file_key = target_model_key[index::] # expected result is /user_id={user_id}/{tar_gz_file_name}
                
                # target_model_file_key = f'/{target_model_file_name}' 
                print("Target model file key: ", target_model_file_key)
                print("Got the most recent target model file. Invoking endpoint.")
            
            except Exception as e:
                print(e)
                print("Error listing the model files in the bucket. Make sure the S3 folder exists and that there are files in there.")
                raise e

            # path for models is /saved_models/movement={movement}/{target_model_file_key}
            response_invoke = sagemaker_runtime.invoke_endpoint(EndpointName=endpoint_parameter_value,
                                                                ContentType='application/json',
                                                                TargetModel=target_model_file_key,
                                                                Body=invokeEndpointInput)  # need the endpoint name and target model tar

            print("Response, Invoke Endpoint: ", response_invoke)

            data_body = response_invoke['Body'].read()
            data = json.loads(data_body)

        except Exception as e:
            print(e)
            print('Error invoking Sagemaker endpoint. Make sure that an endpoint and a model for this user exist first. Also, make sure the recording contains the right number of axes from sensor components.')
            raise (e)

        # send the score from invoking endpoint to RDS
        send_data_to_rds(data, user_id, test_event_id)
            

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
        response_put = s3.put_object(Body=df_parquet, Bucket=bucket, Key=path_parquet)
        print("Response, Put in S3 Bucket:", response_put)

    except Exception as e:
        print(e)
        print('In file format conversion function. Error putting object into bucket {}. Make sure the object exists and your bucket is in the same region as this function.'.format(bucket))
        raise e


"""

"""

def make_training_job_and_add_model(bucket, training_folder_path, model_location_prefix_key, training_job_location_prefix_s3_uri, user_id):
    print("Check training requirement and make training job.")
    sagemaker_bucket = os.environ['sagemaker_bucket_name'] # TODO: change relevant bucket arguments to sagemaker_bucket

    # list the training files in the training folder, get the data, send them to a training job, and add a model to an endpoint
    try:
        print("Getting the number of training files in the S3 training folder.")
        response_list_obj = s3.list_objects_v2(Bucket=bucket, StartAfter=training_folder_path, Prefix=training_folder_path)
        training_object_count = response_list_obj['KeyCount']

    except Exception as e:
        print(e)
        print('Error getting the number of training files at path {} from bucket {}.'.format(training_folder_path, bucket))
        raise e

    # TODO: fix the conditionals to % 10, == 0, and >= 10
    if (training_object_count % 5 == 0 and training_object_count >= 5):
        print("There are enough training files.")

        try:
            print("Getting execution role for Sagemaker.")
            # role = get_execution_role()
            role = os.environ['sagemaker_execution_role']
            print("Finished getting execution role.")

        except Exception as e:
            print(e)
            print("Cannot get execution role for Sagemaker.")
            raise e
        
        # launch training job, get the S3 key to the artifact, and make a name using the artifact key naming
        try:
            tf_estimator = launch_training_job(bucket, training_folder_path, role, training_job_location_prefix_s3_uri, user_id)
            print("Finished launching training job: ", tf_estimator.latest_training_job.job_name)

            artifact_s3_uri = tf_estimator.latest_training_job.describe()["ModelArtifacts"]["S3ModelArtifacts"]
            artifact_s3_path = artifact_s3_uri.replace('s3://', '')
            
            artifact_bucket = artifact_s3_path.split("/")[0] # first list item is bucket name
            print("Artifact S3 Bucket Location: ", artifact_bucket)
            
            artifact_key = artifact_s3_uri.replace(artifact_bucket + "/", '') # remove bucket name from artifact_s3_uri to get the key
            print("Artifact S3 key: ", artifact_key)
            
            model_file_name = artifact_key.split("/")[-3] + ".tar.gz"
            print("Model File Name: ", model_file_name)
            
        except Exception as e:
            print(e)
            print("Error with training job process.")
            return
            
            
        # add model to endpoint by copying the new model data tar file into the correct S3 location for the MultiDataModel
        try:
            copy_destination_key = f'{model_location_prefix_key}/user_id={user_id}/{model_file_name}'
            copy_response = s3.copy_object(CopySource=artifact_s3_path, Bucket=sagemaker_bucket, Key=copy_destination_key)
            print("Copy: ", copy_response)
            
        except Exception as e:
            print(e)
            print("Error with copying the file to S3 to add a model.")
            raise e

    else:
        print("Not enough training recordings yet.")


"""

"""

def make_training_job_and_endpoint(bucket, training_folder_path, model_location_prefix_key, training_job_location_prefix_s3_uri, user_id, endpoint_parameter_name):
    print("Making training job and endpoint.")
    endpointName = os.environ['endpoint_name']
    sagemaker_bucket = os.environ['sagemaker_bucket_name']

    try:
        print("Getting the number of training files in the S3 training folder.")
        response_list_obj = s3.list_objects_v2(Bucket=bucket, StartAfter=training_folder_path, Prefix=training_folder_path)
        training_object_count = response_list_obj['KeyCount']

    except Exception as e:
        print(e)
        print('Error getting the number of training files at path {} from bucket {}.'.format(training_folder_path, bucket))
        raise e
    
    # TODO: fix the conditionals to % 10, == 0, and >= 10
    if (training_object_count % 5 == 0 and training_object_count >= 5):
        print("There are enough training files.")

        try:
            print("Getting execution role for Sagemaker.")
            # role = get_execution_role() # TODO: remove later
            role = os.environ['sagemaker_execution_role']
            print("Finished getting execution role.")

        except Exception as e:
            print(e)
            print("Cannot get execution role for Sagemaker.")
            raise e

        # launch training job, get the S3 key to the artifact, and make a name using the artifact key naming
        try:
            tf_estimator = launch_training_job(bucket, training_folder_path, role, training_job_location_prefix_s3_uri, user_id)
            print("Finished launching training job: ", tf_estimator.latest_training_job.job_name)

            artifact_s3_uri = tf_estimator.latest_training_job.describe()["ModelArtifacts"]["S3ModelArtifacts"]
            artifact_s3_path = artifact_s3_uri.replace('s3://', '')
            
            artifact_bucket = artifact_s3_path.split("/")[0] # first list item is bucket name
            print("Artifact S3 Bucket Location: ", artifact_bucket)
            
            artifact_key = artifact_s3_uri.replace(artifact_bucket + "/", '') # remove bucket name from artifact_s3_uri to get the key
            print("Artifact S3 key: ", artifact_key)
            
            model_name = artifact_key.split("/")[-3]
            print("Model Name: ", model_name)
            
        except Exception as e:
            print(e)
            print("Error with training job process.")
            return
            
        # add model to endpoint by copying the new model data tar file into the correct S3 location for the MultiDataModel
        try:
            model_file_name = artifact_key.split("/")[-3] + ".tar.gz"
            copy_destination_key = f'{model_location_prefix_key}/user_id={user_id}/{model_file_name}'
            copy_response = s3.copy_object(CopySource=artifact_s3_path, Bucket=sagemaker_bucket, Key=copy_destination_key)
            print("Copy: ", copy_response)
            
        except Exception as e:
            print(e)
            print("Error with copying the file to S3 to add a model.")
            raise e
        
        # make MultiDataModel and deploy to an endpoint
        try:
            model_location_prefix = f's3://{sagemaker_bucket}/{model_location_prefix_key}'
            session = Session()
            
            model = TensorFlowModel(model_data=tf_estimator.model_data, name=model_name, role=role, framework_version="2.3.0", sagemaker_session=session)
            multiModel = MultiDataModel(name=endpointName, model_data_prefix=model_location_prefix, model=model, sagemaker_session=session)

            print("\nMade multi-model. Making a new endpoint.\n")

            # deploy endpoint
            predictor = multiModel.deploy(
                initial_instance_count=1, instance_type="ml.m4.xlarge", endpoint_name=endpointName
            )

            print("\nNew endpoint has been made.\n")

            predictor.serializer = JSONSerializer()
            predictor.deserializer = JSONDeserializer()

            print("Added JSON serializer and deserializer to the multi-model endpoint.")
            
        except Exception as e:
            print(e)
            print("Error making a model and deploying to an endpoint.")
            raise e

        # TODO: test if this works for cdk deployment
        # add the endpoint name to Parameter Store
        try:
            print("Putting endpoint name into Parameter Store.")
            response_put_parameter = ssm.put_parameter(Name=endpoint_parameter_name, Value=endpointName, Type='String', Tier="Standard") 
            
            print("Response, Put Parameter: ", response_put_parameter)
            
        except Exception as e:
            print(e)
            print("Error with adding the endpoint name to Parameter Store.")
            raise e
        
    else:
        print("Not enough training recordings yet.")


"""
This function creates a Sagemaker training job. 

bucket: a string representing the bucket name for the training folder
training_folder_key: a string representing the training folder path within the bucket

Returns - a TensorFlow estimator from Sagemaker
"""
def launch_training_job(bucket, training_folder_key, role, training_job_location_prefix_s3_uri, user_id):

    print("Sending data inputs for training job.")

    # For the job naming, the expected name is {user_id}-{date and time stamp}; any longer may exceed character limit for base job name
    tf_estimator = TensorFlow(
        entry_point="LSTM.py",  # training script name
        source_dir='ml-training-script',  # training script source directory on your code
        model_dir=f'/opt/ml/model',
        role=role,
        instance_count=1,
        instance_type="ml.g4dn.8xlarge",  # training instance
        framework_version="2.3.0", # tensorflow version; 2.4 currently has a bug when model is deployed
        py_version="py37",  # python version
        code_location=training_job_location_prefix_s3_uri, #S3 location for training job output file storage
        output_path=training_job_location_prefix_s3_uri, #S3 location for training job file storage
        base_job_name=f'{user_id}',  # Modifying the training job name
    )

    print("Fitting training folder data into the Sagemaker Estimator.")
    tf_estimator.fit(f's3://{bucket}/{training_folder_key}')

    print("Returning the Sagemaker Estimator.")
    return tf_estimator


"""
This function turns a Pandas Dataframe into the appropriate size and shape, while also doing other
pre-processing functionalities.

df: a Pandas Dataframe containing the accelerometer, gyroscope, and magnetometer columns

Returns - a NumPy array containing the modified data from df
"""

def preprocess_data(df):
    
    pad_length = (2000-len(df['ax']))//2
    print("Pad Length: ", pad_length)

    ax_normal_stft = np.abs(stft(np.pad(df['ax'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)
    ay_normal_stft = np.abs(stft(np.pad(df['ay'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)
    az_normal_stft = np.abs(stft(np.pad(df['az'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)

    ax_normal_stft_largest = nlargest(50, ax_normal_stft.flatten())
    ax_normal_stft_smallest = nsmallest(50, ax_normal_stft.flatten())
    ay_normal_stft_largest = nlargest(50, ay_normal_stft.flatten())
    ay_normal_stft_smallest = nsmallest(50, ay_normal_stft.flatten())
    az_normal_stft_largest = nlargest(50, az_normal_stft.flatten())
    az_normal_stft_smallest = nsmallest(50, az_normal_stft.flatten())

    gx_normal_stft = np.abs(stft(np.pad(df['gx'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)
    gy_normal_stft = np.abs(stft(np.pad(df['gy'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)
    gz_normal_stft = np.abs(stft(np.pad(df['gz'], (pad_length,), 'median'), scaling='psd', nperseg=512, fs=1)[2]**2)

    gx_normal_stft_largest = nlargest(50, gx_normal_stft.flatten())
    gx_normal_stft_smallest = nsmallest(50, gx_normal_stft.flatten())
    gy_normal_stft_largest = nlargest(50, gy_normal_stft.flatten())
    gy_normal_stft_smallest = nsmallest(50, gy_normal_stft.flatten())
    gz_normal_stft_largest = nlargest(50, gz_normal_stft.flatten())
    gz_normal_stft_smallest = nsmallest(50, gz_normal_stft.flatten())

    mx_normal_stft=np.abs(stft(np.pad(df['mx'],(pad_length,),'median'), scaling='psd',nperseg=512,fs=1)[2]**2)
    my_normal_stft=np.abs(stft(np.pad(df['my'],(pad_length,),'median'), scaling='psd',nperseg=512,fs=1)[2]**2)
    mz_normal_stft=np.abs(stft(np.pad(df['mz'],(pad_length,),'median'), scaling='psd',nperseg=512,fs=1)[2]**2)

    mx_normal_stft_largest=nlargest(50,mx_normal_stft.flatten())
    mx_normal_stft_smallest=nsmallest(50,mx_normal_stft.flatten())
    my_normal_stft_largest=nlargest(50,my_normal_stft.flatten())
    my_normal_stft_smallest=nsmallest(50,my_normal_stft.flatten())
    mz_normal_stft_largest=nlargest(50,mz_normal_stft.flatten())
    mz_normal_stft_smallest=nsmallest(50,mz_normal_stft.flatten())

    data = [*ax_normal_stft_largest,*ax_normal_stft_smallest,*ay_normal_stft_largest,*ay_normal_stft_smallest,*az_normal_stft_largest,*az_normal_stft_smallest,*gx_normal_stft_largest,*gx_normal_stft_smallest,*gy_normal_stft_largest,*gy_normal_stft_smallest,*gz_normal_stft_largest,*gz_normal_stft_smallest,
            *mx_normal_stft_largest,*mx_normal_stft_smallest,*my_normal_stft_largest,*my_normal_stft_smallest,*mz_normal_stft_largest,*mz_normal_stft_smallest]

    # data = [*ax_normal_stft_largest, *ax_normal_stft_smallest, *ay_normal_stft_largest, *ay_normal_stft_smallest, *az_normal_stft_largest, *az_normal_stft_smallest,
    #         *gx_normal_stft_largest, *gx_normal_stft_smallest, *gy_normal_stft_largest, *gy_normal_stft_smallest, *gz_normal_stft_largest, *gz_normal_stft_smallest]

    X = np.array(data)
    print("X shape: ", X.shape)

    X = np.reshape(X, (1, 1, X.shape[0]))
    print("Post-processing shape: ", X.shape)

    return X


# TODO: this is the actual preprocessing function to use, without padding; uncomment after finishing the test with current endpoint

# def preprocess_data(df):
    
#     ax_stft=np.abs(stft(df['ax'],nperseg=512,fs=1)[2]**2)
#     ay_stft=np.abs(stft(df['ay'],nperseg=512,fs=1)[2]**2)
#     az_stft=np.abs(stft(df['az'],nperseg=512,fs=1)[2]**2)
    
#     ax_stft_largest=nlargest(50,ax_stft.flatten())
#     ax_stft_smallest=nsmallest(50,ax_stft.flatten())
#     ay_stft_largest=nlargest(50,ay_stft.flatten())
#     ay_stft_smallest=nsmallest(50,ay_stft.flatten())
#     az_stft_largest=nlargest(50,az_stft.flatten())
#     az_stft_smallest=nsmallest(50,az_stft.flatten())
    
#     gx_stft=np.abs(stft(df['gx'],nperseg=512,fs=1)[2]**2)
#     gy_stft=np.abs(stft(df['gy'],nperseg=512,fs=1)[2]**2)
#     gz_stft=np.abs(stft(df['gz'],nperseg=512,fs=1)[2]**2)
    
#     gx_stft_largest=nlargest(50,gx_stft.flatten())
#     gx_stft_smallest=nsmallest(50,gx_stft.flatten())
#     gy_stft_largest=nlargest(50,gy_stft.flatten())
#     gy_stft_smallest=nsmallest(50,gy_stft.flatten())
#     gz_stft_largest=nlargest(50,gz_stft.flatten())
#     gz_stft_smallest=nsmallest(50,gz_stft.flatten())
    
#     mx_stft=np.abs(stft(df['mx'],nperseg=512,fs=1)[2]**2)
#     my_stft=np.abs(stft(df['my'],nperseg=512,fs=1)[2]**2)
#     mz_stft=np.abs(stft(df['mz'],nperseg=512,fs=1)[2]**2)
    
#     mx_stft_largest=nlargest(50,mx_stft.flatten())
#     mx_stft_smallest=nsmallest(50,mx_stft.flatten())
#     my_stft_largest=nlargest(50,my_stft.flatten())
#     my_stft_smallest=nsmallest(50,my_stft.flatten())
#     mz_stft_largest=nlargest(50,mz_stft.flatten())
#     mz_stft_smallest=nsmallest(50,mz_stft.flatten())
    
#     data = [*ax_stft_largest, *ax_stft_smallest, *ay_stft_largest, *ay_stft_smallest, *az_stft_largest, *az_stft_smallest, *gx_stft_largest, *gx_stft_smallest, *gy_stft_largest, *gy_stft_smallest, *gz_stft_largest, *gz_stft_smallest,
#             *mx_stft_largest, *mx_stft_smallest, *my_stft_largest, *my_stft_smallest, *mz_stft_largest, *mz_stft_smallest]
   
#     X = np.array(data)
#     print("X shape: ", X.shape)

#     X = np.reshape(X, (1, 1, X.shape[0]))
#     print("Post-processing shape: ", X.shape)

#     return X

"""
This function takes the necessary ML output data, and updates the database's specified test event with that data.

data: a dictionary representing the output from the ML model
user_id: the string representing the patient id in the database
test_event_id: the string representing the test event id in the database
"""


def send_data_to_rds(data, user_id, test_event_id):

    secrets_manager_client = boto3.client("secretsmanager")

    try:
        response = secrets_manager_client.get_secret_value(SecretId=os.environ["rds_secret_name"])["SecretString"]  # TODO: add the secret id when deploying
        secret = json.loads(response)
        print("Retrieved secret for database.")

    except Exception as e:
        print(e)
        print("Error getting the RDS secret from Secrets Manager.")
        raise e

    # TODO: see if we want environment variables for host
    try:
        print("Starting connection to database.")
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

    try:
        # to change from a decimal to a percentage
        score = data["predictions"][0][0] * 100
        print("Adding score to the database.")

        query = 'UPDATE "TestEvent" SET balance_score = %s WHERE test_event_id = %s AND patient_id = %s'
        cursor.execute(query, vars=(score, test_event_id, user_id))

        rds_pg_connection.commit()
        print("Updated data for the test event in the database.")

        # TODO: remove after testing
        # query = 'SELECT * FROM "TestEvent" WHERE test_event_id = %s AND patient_id = %s'
        # cursor.execute(query, vars=(test_event_id, user_id))
        # for record in cursor:
        #     print("Cursor record:", record)
            
    except Exception as e:
        print(e)
        print("Error with inserting a score into the RDS database. Check that a score, test event id, and user id are actually provided.")
        raise e
    
    cursor.close()
    rds_pg_connection.close()
    print("Closed database connection.")
