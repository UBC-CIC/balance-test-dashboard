import pg from "pg";
import AWS from "aws-sdk";
const s3 = new AWS.S3();
const sm = new AWS.SecretsManagerClient();
const bucketName = process.env.BUCKET_NAME;

let pool;
const connectDb = async () => {
  try {
    pool = new pg.Pool({
      user: process.env.PGUSER,
      host: process.env.PROXY_ENDPOINT,
      database: process.env.PGDATABASE,
      // password: process.env.PGPASSWORD,
      password: dbPassword,
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

const secret_name = "postgres-credentials";

const client = new sm.SecretsManagerClient({
  region: process.env.AWS_REGION,
});

let response;

try {
  response = await client.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
    })
  );
} catch (error) {
  // For a list of exceptions thrown, see
  // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
  throw error;
}

const dbPassword = response.SecretString;

export const handler = async (event) => {
  let response;
  try {
    if (event.payload.sql) {
      console.log("event", event);
      let sql = event.payload.sql;
      // let sql=`select * from "Patient"`;
      await connectDb();
      console.log(`about to execute sql: `, sql);
      let res = await pool.query(sql);

      response = {
        statusCode: 200,
        body: res.rows,
      };
    }
  } catch (e) {
    response = { statusCode: 200, body: e };
  }
  return response;
};
