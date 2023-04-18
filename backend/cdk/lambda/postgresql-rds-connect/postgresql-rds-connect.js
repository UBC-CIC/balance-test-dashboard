//TODO: add layer for pg

// import pg from "pg";
const pg = require("pg");
const AWS = require("aws-sdk");
// import AWS from 'aws-sdk'

const PROXY_ENDPOINT = process.env.PGHOST;
const sm = new AWS.SecretsManager({ region: process.env.AWS_REGION });
// const secret_name = "postgresql-credentials";
const secret_name = process.env.PG_SECRET_NAME;

let pool;
const connectDb = async () => {
  let secret;
  try {
    let secretResponse = await sm
      .getSecretValue({ SecretId: secret_name })
      .promise();
    // let dbPassword = secretResponse.SecretString;
    secret = JSON.parse(secretResponse.SecretString);
  } catch (error) {
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    throw error;
  }

  try {
    pool = new pg.Pool({
      // user: process.env.PGUSER,
      user: secret.username,
      host: PROXY_ENDPOINT,
      database: process.env.PGDATABASE,
      // password: process.env.PGPASSWORD,
      password: secret.password,
      port: process.env.PGPORT,
    });
    await pool.connect();
    console.log("pool connected");
    // await pool.end();
  } catch (error) {
    console.log("Error connecting to the database");
    console.log(error);
  }
};

const createTableSql = `CREATE TABLE "TestEvent" (
  "test_event_id" varchar PRIMARY KEY,
  "patient_id" varchar NOT NULL,
  "test_type" varchar NOT NULL,
  "balance_score" integer,
  "doctor_score" integer,
  "notes" text,
  "start_time" timestamp,
  "end_time" timestamp
);

CREATE TABLE "Patient" (
  "patient_id" varchar PRIMARY KEY,
  "first_name" varchar,
  "middle_name" varchar,
  "last_name" varchar,
  "email" varchar,
  "privacy_consent_date" timestamp 
);

CREATE TABLE "CareProvider" (
  "care_provider_id" varchar PRIMARY KEY,
  "email" varchar UNIQUE NOT NULL
);

CREATE TABLE "PatientCareProvider" (
  "care_provider_id" varchar NOT NULL,
  "patient_id" varchar NOT NULL,
  PRIMARY KEY ("care_provider_id", "patient_id")
);

CREATE TABLE "PatientTestAssignment" (
  "patient_id" varchar NOT NULL,
  "test_type" varchar NOT NULL,
  PRIMARY KEY ("patient_id", "test_type")
);

CREATE TABLE "Test" (
  "test_type" varchar PRIMARY KEY,
  "instructions" text,
  "duration_in_seconds" integer
);

ALTER TABLE "PatientCareProvider" ADD FOREIGN KEY ("patient_id") REFERENCES "Patient" ("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientCareProvider" ADD FOREIGN KEY ("care_provider_id") REFERENCES "CareProvider" ("care_provider_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestEvent" ADD FOREIGN KEY ("patient_id") REFERENCES "Patient" ("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestEvent" ADD FOREIGN KEY ("test_type") REFERENCES "Test" ("test_type") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "PatientTestAssignment" ADD FOREIGN KEY ("patient_id") REFERENCES "Patient" ("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientTestAssignment" ADD FOREIGN KEY ("test_type") REFERENCES "Test" ("test_type") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Test" (test_type, instructions, duration_in_seconds)
    VALUES ('sit-to-stand', '1. Sit on a chair with knees bent at a 90-degree angle and both feet flat on the floor\n2. Attach your mobile device to your chest with the chest strap\n3. Click the start button on the next page to begin recording your movement\n4. Stand up - Try to avoid using your hands for support\n5. Tap on the screen to end the recording\n6. Review recording details and add additional notes if needed\n7. Click send to send to your doctor or back to restart', 60);
`;

// Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started.html

let dbPassword;

exports.handler = async (event, context) => {
  let response;
  try {
    await connectDb();
    let createTablesRes = await pool.query(createTableSql);
  } catch (e) {
    // console.log("e", e);
    console.log("tables already created");
  }
  try {
    if (event.payload.sql) {
      let sql = event.payload.sql;
      console.log(`about to execute sql: `, sql);
      let res = await pool.query(sql);

      response = {
        statusCode: 200,
        body: res.rows,
      };
    }
  } catch (e) {
    response = { statusCode: 500, body: e };
  }
  return response;
};
