// import AWS from "aws-sdk";

// const S3 = require("aws-sdk/clients/S3");
// const AWS = require("aws-sdk");
// const s3 = new AWS.S3();
// const bucketName = process.env.BUCKET_NAME;
const bucketName = "json-to-parquet-poc-bucket";
// todo: err handling, env var

exports.handler = async (event) => {
  const AWS = require("aws-sdk");

  const s3 = new AWS.S3();
  let resp;
  console.log("event.payload.s3QueryParams", event.payload.s3QueryParams);
  // try {
  if (event.payload.s3QueryParams) {
    // const params = {
    //   Bucket: bucketName,
    //   Key: event.payload.s3QueryParams.key,
    // };
    const params = {
      Bucket: bucketName,
      Key: event.payload.s3QueryParams.key,
      ExpressionType: "SQL",
      Expression: "SELECT ts, ax FROM s3object",
      InputSerialization: {
        // CSV: {
        //   FileHeaderInfo: "USE",
        //   RecordDelimiter: "\n",
        //   FieldDelimiter: ",",
        // },
        Parquet: {},
      },
      OutputSerialization: {
        JSON: {},
      },
    };
    console.log(
      "Retrieving object from bucket: " +
        bucketName +
        ", s3 params: " +
        JSON.stringify(params)
    );
    // const data = await s3.selectObjectContent(params).promise();
    try {
      let data = await s3.selectObjectContent(params).promise();
      // console.log("data", data);

      // data.Payload is a Readable Stream
      const eventStream = data.Payload;
      // console.log("eventStream", eventStream);

      // Read events as they are available
      eventStream.on("data", (event) => {
        console.log("event", event);
        if (event.Records) {
          // event.Records.Payload is a buffer containing
          // a single record, partial records, or multiple records
          console.log(
            "event.Records.Payload.toString()",
            event.Records.Payload.toString()
          );
          // process.stdout.write(event.Records.Payload.toString());
        } else if (event.Stats) {
          console.log(`Processed ${event.Stats.Details.BytesProcessed} bytes`);
        } else if (event.End) {
          console.log("SelectObjectContent completed");
        }
      });

      // Handle errors encountered during the API call
      eventStream.on("error", (err) => {
        console.log("err", err);
      });

      eventStream.on("end", () => {
        // Finished receiving events from S3
      });
    } catch (e) {
      console.log("e", e);
    }
    // console.log("data", data);
    // const content = data.Body.toString("utf-8");
    // console.log("content", content);
    // resp = {
    //   content: content,
    // };
  }
  // } catch (e) {
  //   console.log(e);
  //   resp = { statusCode: 200, body: e };
  // }
  return resp;
};
