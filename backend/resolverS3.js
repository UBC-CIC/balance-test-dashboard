import AWS from "aws-sdk";
// const AWS = require("aws-sdk");
const s3 = new AWS.S3();
// const bucketName = process.env.BUCKET_NAME;
const bucketName = "json-to-parquet-poc-bucket";
// todo: err handling, env var

export const handler = async (event) => {
  let response;
  try {
    if (event.payload.s3QueryParams) {
      const params = {
        Bucket: bucketName,
        Key: s3QueryParams.key,
      };
      console.log(
        "Retrieving object from bucket: " +
          bucketName +
          ", s3 params: " +
          JSON.stringify(params)
      );
      const data = await s3.getObject(params).promise();
      console.log("data", data);
      const content = data.Body.toString("utf-8");
      console.log("content", content);
      resp = {
        content: content,
      };
    }
  } catch (e) {
    response = { statusCode: 200, body: e };
  }
  return response;
};
