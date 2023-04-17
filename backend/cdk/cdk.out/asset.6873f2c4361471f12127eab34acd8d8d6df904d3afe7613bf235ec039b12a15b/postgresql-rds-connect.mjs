//TODO: add layer for pg, need to make bucket name/PROXY_ENDPOINT not hardcoded, and figure out how to set the process.env stuff

import pg from "pg";
// import AWS from "aws-sdk";
// const AWS = require("aws-sdk");
// const s3 = new AWS.S3();
// const bucketName = process.env.BUCKET_NAME;
const bucketName = "balancetest-datastorage-bucket";
// todo: err handling, env var

const PROXY_ENDPOINT =
  "postgres-proxy.proxy-coyl0mh3hp8c.ca-central-1.rds.amazonaws.com";

let pool;
const connectDb = async () => {
  try {
    pool = new pg.Pool({
      user: process.env.PGUSER,
      host: PROXY_ENDPOINT,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
    });
    await pool.connect();
    console.log("pool connected");
    // await pool.end();
  } catch (error) {
    console.log("err");
    console.log(error);
  }
};

// Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started.html

// import {
//   SecretsManagerClient,
//   GetSecretValueCommand,
// } from "@aws-sdk/client-secrets-manager";

// const secret_name = "postgres-credentials";

// const client = new SecretsManagerClient({
//   region: "ca-central-1",
// });

// let response;

// try {
//   response = await client.send(
//     new GetSecretValueCommand({
//       SecretId: secret_name,
//       VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
//     })
//   );
// } catch (error) {
//   // For a list of exceptions thrown, see
//   // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
//   throw error;
// }

// const secret = response.SecretString;

// Your code goes here

export const handler = async (event, context) => {
  let response;
  try {
    if (event.payload.sql) {
      console.log("event", event);
      console.log('context',context)
      let sql = event.payload.sql;
      // let sql=`delete from "TestEvent" where patient_id='1ec6234a-232a-415d-9d31-f059c2cc4afa'`;
      await connectDb();
      console.log(`about to execute sql: `, sql);
      let res = await pool.query(sql);
      console.log("sql execution result", res);

      response = {
        statusCode: 200,
        body: res.rows,
      };
    } 
    // else if (event.payload.s3QueryParams) {
    //   const params = {
    //     Bucket: bucketName,
    //     Key: s3QueryParams.key,
    //   };
    //   console.log(
    //     "Retrieving object from bucket: " +
    //       bucketName +
    //       ", s3 params: " +
    //       JSON.stringify(params)
    //   );
    //   const data = await s3.getObject(params).promise();
    //   console.log("data", data);
    //   const content = data.Body.toString("utf-8");
    //   console.log("content", content);
    //   resp = {
    //     content: content,
    //   };
    // }
  } catch (e) {
    response = { statusCode: 200, body: e };
  }
  return response;
};
