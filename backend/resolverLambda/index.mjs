import pg from "pg";

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

export const handler = async (event) => {
  let response;
  try {
    console.log("event", event);
    let sql = event.payload.sql;
    // let sql=`select * from "Patient"`;
    await connectDb();
    console.log(`about to execute sql: `, sql);
    let res = await pool.query(sql);
    console.log("sql execution result", res);

    response = {
      statusCode: 200,
      body: res.rows,
    };
  } catch (e) {
    response = { statusCode: 200, body: err };
  }
  return response;
};
