const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const bucketName = process.env.CONTENT_BUCKET;

exports.handler = async (event, context) => {
  let resp = {};
  try {
    // create contents in s3 bucket
    if (event.info.fieldName === "createPostContent") {
      if (!event.arguments.input.postId || !event.arguments.input.content) {
        const errorMessage = "missing required parameters in createPostContent";
        console.error("Exception occurred: ", errorMessage);
        throw new Error(errorMessage);
      }
      const params = {
        Body: event.arguments.input.content,
        ContentType: "text/plain",
        Bucket: bucketName,
        Key:
          event.prev.result.items[0].userId +
          "/" +
          event.arguments.input.postId,
      };
      console.log(
        "Creating object in bucket: " +
          bucketName +
          ", s3 params: " +
          JSON.stringify(params)
      );
      const data = await s3.putObject(params).promise();
      resp = {
        etag: data.ETag,
      };
    }
    // get contents from s3 bucket
    else if (event.info.fieldName === "getPostContent") {
      if (!event.arguments.input.postId) {
        const errorMessage = "missing required parameters in getPostContent";
        console.error("Exception occurred: ", errorMessage);
        throw new Error(errorMessage);
      }
      const params = {
        Bucket: bucketName,
        Key:
          event.prev.result.items[0].userId +
          "/" +
          event.arguments.input.postId,
      };
      console.log(
        "Retrieving object from bucket: " +
          bucketName +
          ", s3 params: " +
          JSON.stringify(params)
      );
      const data = await s3.getObject(params).promise();
      const content = data.Body.toString("utf-8");
      resp = {
        content: content,
      };
    } else {
      const errorMessage = "unsupported operation" + event.info.fieldName;
      console.error("Exception occurred: ", errorMessage);
      throw new Error(errorMessage);
    }
  } catch (ex) {
    console.error("Exception occurred: ", ex.message);
    const promise = new Promise((resolve, reject) => {
      reject(ex.message);
    });
    return promise;
  }

  return resp;
};
