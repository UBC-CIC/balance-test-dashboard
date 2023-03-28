// This is sample code. Please update this to suite your schema
const AWS = require("aws-sdk");
const cognitoIdentity = new AWS.CognitoIdentity();
const cognito = new AWS.CognitoIdentityServiceProvider();
const jwt = require("jsonwebtoken");

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  const {
    authorizationToken,
    requestContext: { variables: patient_id },
  } = event;
  let token = authorizationToken.replace("prefix-", "");

  const user_cognito_id = jwt.decode(token).sub;
  let params = {
    // todo: remove hard-coded value
    UserPoolId: "ca-central-1_qBJ3I7w8V",
    Username: user_cognito_id,
  };
  let getUserResponse = await cognito.adminGetUser(params).promise();
  let identityId = getUserResponse.UserAttributes[6].Value;
  console.log("identityId", identityId);

  const response = {
    isAuthorized:
      patient_id === identityId ||
      getUserResponse.UserAttributes[4].Value == "care_provider_user",
    // resolverContext: {
    //   userid: "user-id",
    //   info: "contextual information A",
    //   more_info: "contextual information B",
    // },
    // deniedFields: [
    //   `arn:aws:appsync:${process.env.AWS_REGION}:${accountId}:apis/${apiId}/types/Event/fields/comments`,
    //   `Mutation.createEvent`,
    // ],
    ttlOverride: 300,
  };
  console.log(`response >`, JSON.stringify(response, null, 2));
  return response;
};
