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

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "app.lambda_handler" ]