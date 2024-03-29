import os
import io
import boto3
import json
from difflib import SequenceMatcher
from datetime import datetime
import matplotlib.pyplot as plt
from fpdf import FPDF
# import pandas as pd


bucket = os.environ["S3_BUCKET_NAME"]
region = os.environ["AWS_REGION"]

s3_client = boto3.client('s3')

MEASUREMENT_MAPPING = {'ax': 'Accelerometer X Axis',
                       'ay': 'Accelerometer Y Axis',
                       'az': 'Accelerometer Z Axis',
                       'gx': 'Gyroscope X Axis',
                       'gy': 'Gyroscope Y Axis',
                       'gz': 'Gyroscope Z Axis',
                       'mx': 'Magnetometer X Axis',
                       'my': 'Magnetometer Y Axis',
                       'mz': 'Magnetometer Z Axis'}


def lambda_handler(event, context):
    def plot(m, line):

        fig, ax = plt.subplots(figsize=(8, 2))

        ax.plot(data_in_array['ts'], data_in_array[m])

        ax.set(xlabel='Timestamp', ylabel='Value',
               title=f'{MEASUREMENT_MAPPING[m]} Values')
        ax.grid()

        img_buffer = io.BytesIO()
        fig.savefig(img_buffer, format="jpeg")
        img_buffer.seek(0)

        pdf.image(img_buffer, x=10, y=line, w=190)
        # pdf.image(img_buffer, x=10, w=190)

        plt.clf()

    # print('event')
    # print(event)
    if ('s3key' in event['payload']):
        key = event['payload']['s3key']
        patient_name = event['payload']['patientName']

        template = "parquet_data/patient_tests/user_id=%/movement=%/year=%/month=%/day=%/test_event_id=%/test_event_%.parquet"

        user_id, movement, year, month, day, test_event_id,  test_event_id2 = extract(
            template, key)
        # pdf_path = f'parquet_data/patient_tests/user_id={user_id}/movement={movement}/year={year}/month={month}/day={day}/test_event_id={test_event_id}/test_event_{test_event_id}.pdf'
        parquet_path = f'parquet_data/patient_tests/user_id={region}:{user_id}/movement={movement}/year={year}/month={month}/day={day}/test_event_id={test_event_id}/test_event_{test_event_id}.parquet'
        pdf_path = f'pdf_reports/user_id={region}:{user_id}/test_event_{test_event_id}.pdf'

        csv_path = f'csv_data/patient_tests/user_id={region}:{user_id}/movement={movement}/year={year}/month={month}/day={day}/test_event_id={test_event_id}/test_event_{test_event_id}.csv'

        # print('parquet_path', parquet_path)
        raw = s3_client.get_object(Bucket=bucket, Key=parquet_path)
        parquet = raw['Body'].read()
        # df = pd.read_parquet(parquet)
        # csv = df.to_csv()
        # s3_client.put_object(Bucket=bucket, Key=csv_path)

        csv_url = s3_client.generate_presigned_url(ClientMethod='get_object',
                                                   Params={
                                                       'Bucket': bucket,
                                                       'Key': csv_path,
                                                       #    'ResponseContentDisposition': 'attachment;filename=file.csv',
                                                       #    'ResponseContentType': 'text/csv'
                                                   },
                                                   ExpiresIn=60*5,
                                                   )
        try:
            s3_client.head_object(
                Bucket=bucket, Key=pdf_path)
            pdf_url = s3_client.generate_presigned_url(ClientMethod='get_object',
                                                       Params={
                                                           'Bucket': bucket,
                                                           'Key': pdf_path
                                                       },
                                                       ExpiresIn=60*5
                                                       )

            return {"status": 200, "body": {'pdf_url': pdf_url, 'raw_url': csv_url}}
        except:
            print('pdf not generated before')

        # query s3 object to select everything
        sql = "SELECT * FROM s3object s"
        res = s3_client.select_object_content(
            Bucket=bucket,
            Key=parquet_path,
            ExpressionType='SQL',
            Expression=sql,
            InputSerialization={'Parquet': {}},
            OutputSerialization={'JSON': {}}
        )

        # convert result to object
        full_records = ''
        json_list = []
        data_in_array = {'ts': [], 'ax': [], 'ay': [], 'az': [], 'gx': [],
                         'gy': [], 'gz': [], 'mx': [], 'my': [], 'mz': []}

        for event in res['Payload']:
            if 'Records' in event:
                records = event['Records']['Payload'].decode('utf-8')
                # print('records', records)
                full_records += records

        records_list = full_records.strip().split('\n')

        for r in records_list:
            json.loads(r)
            # json_list.append(json.loads(r))
            # data_in_array['ts'].append(datetime.strptime(
            #     (json.loads(r)['ts']), '%Y-%m-%d %H:%M:%S.%f %z'))
            try:
                data_in_array['ts'].append(datetime.strptime(
                    (json.loads(r)['ts']), '%Y-%m-%d %H:%M:%S.%f %z'))
            except:
                data_in_array['ts'].append(datetime.strptime(
                    (json.loads(r)['ts']), '%Y-%m-%d %H:%M:%S.%f'))

            data_in_array['ax'].append(float(json.loads(r)['ax']))
            data_in_array['ay'].append(float(json.loads(r)['ay']))
            data_in_array['az'].append(float(json.loads(r)['az']))
            data_in_array['gx'].append(float(json.loads(r)['gx']))
            data_in_array['gy'].append(float(json.loads(r)['gy']))
            data_in_array['gz'].append(float(json.loads(r)['gz']))
            data_in_array['mx'].append(float(json.loads(r)['mx']))
            data_in_array['my'].append(float(json.loads(r)['my']))
            data_in_array['mz'].append(float(json.loads(r)['mz']))

        # make pdf
        pdf = FPDF()
        pdf.add_page()
        pdf_buffer = io.BytesIO()

        pdf.set_font("Arial", size=12)

        start_time = data_in_array['ts'][0]

        pdf.cell(
            200, 10, f'Test Details for {patient_name} ({user_id})')
        pdf.ln(10)
        pdf.cell(200, 8, f'{movement}, {year}/{month}/{day}/{start_time}')

        line = 40
        # current_page_line = line
        for m in MEASUREMENT_MAPPING:
            plot(m, line)
            line += 60
            pdf.ln(10)
            if (line > 250):
                pdf.add_page()
                line = 0

        pdf.output(pdf_buffer)
        pdf_buffer.seek(0)

        # s3_client.upload_file(pdf_buffer, bucket, 'test.pdf')
        s3_client.put_object(Body=pdf_buffer, Bucket=bucket,
                             Key=pdf_path)

        pdf_url = s3_client.generate_presigned_url(ClientMethod='get_object',
                                                   Params={
                                                       'Bucket': bucket,
                                                       'Key': pdf_path
                                                   },
                                                   ExpiresIn=60*5
                                                   )

        return {"status": 200, "body": {'pdf_url': pdf_url, 'raw_url': csv_url}}


def extract(template, text):
    seq = SequenceMatcher(None, template, text, True)
    return [text[c:d] for tag, a, b, c, d in seq.get_opcodes() if tag == 'replace']
