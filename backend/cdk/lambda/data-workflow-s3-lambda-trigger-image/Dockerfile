# TODO: change file name to Dockerfile for cdk
FROM public.ecr.aws/lambda/python:3.9

# To update for image issues
RUN yum update nss -y && yum update libxml2 -y

# Install the function's dependencies using file requirements.txt
# from your project folder.

COPY requirements.txt  .
RUN  python3.9 -m pip install -r requirements.txt 
#--target "${LAMBDA_TASK_ROOT}"

# Copy function code
COPY app.py .

# Copy the folder with the ML code
COPY ml-training-script ./ml-training-script

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "app.lambda_handler" ]

# TODO: change file name from dockerFile to Dockerfile for cdk