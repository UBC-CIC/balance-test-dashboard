# Backend Stack Deep Dive

## Architecture

![alt text](./images/architecture_diagram.svg)

## Description

The Architecture diagram gives an insight into two different event flows: 1) Amplify and API Flow Portion, and 2) Data Input Flow form the Mobile App. For 1), Steps starting with A indicate request flow initiated from the dashboard, while steps starting with B indicate request flow initiated from the mobile app.

### Amplify and API Flow Portion (A1-A17, B1-B17)
1. Care Providers sign in with their email using the web portal.
2. Cognito triggers a Lambda function.
3. The Lambda function assigns the user to the careProvider user group in Cognito.
4. Amplify calls the Appsync API.
5. Cognito passes a generated token representing the user’s identity information to the Appsync API.
6. Cognito triggers a Lambda function, passing the token generated.
7. The Lambda function checks if the user is authorized to perform the query, and then accepts/denies the request.
8. If the request is accepted, Appsync calls a Lambda resolver.
9. The resolver queries/mutates a PostgreSQL database.
10. The database responses with the query result.
11. The Lambda function sends the response to Appsync.
12. If the request is for S3, Appsync calls a Lambda resolver that deals with S3. 
13. Depending on the request, the Lambda function might call Athena.
14. Or, depending on the request, the Lambda function might query the S3 bucket file directly.
15. If the request needs Athena, the Lambda uses Athena to query the specific S3 folder.
16. The Lambda function sends the response to Appsync.
17. Appsync returns the response it got from the Lambda resolvers to Amplify.

### Data Input Flow Portion of the Mobile App (B18-B25)
18. After the user confirms the sending of the recording on the app, JSON data will be sent through Amplify.
19. Amplify will deliver this JSON data to a S3 bucket.
20. This delivery of a JSON file triggers a Lambda function, which receives the event information and gets the JSON .file from the bucket.
21. The Lambda function code, which is made using a Docker image, will first convert the JSON data into CSV and parquet files using the Pandas library, and then store the CSV and parquet files in two different folders of the same S3 bucket. 
22. The Lambda function code comes from an image in Elastic Container Registry, which was made during the solution deployment.
23. Then, the Lambda function checks whether a model endpoint exists. 
24. If the endpoint does not exist, then a training job will be created to train a multi-model. Afterwards, the endpoint will be made from the multi-model. 
25. When there are enough training recordings (minimum 10 per individual) sent in from a care provider’s account, then a training job will be able to start.
26. If the endpoint does exist, then the code checks if there is a model for the user that sent in the data; a training job will start if there is not a model. 
27. If the user has an existing model and a test recording was sent in, then the endpoint will be invoked to have the model provide a score to the recording.
28. If an endpoint is invoked, the prediction scores are sent back to the Lambda function.
29. When a training job is made or when a model is added to the endpoint, those corresponding files will be saved in another S3 bucket.
30. The score that was output from invoking an endpoint will be saved in the RDS database using SQL query executions, based on the test event ID that was specified in the recording.
