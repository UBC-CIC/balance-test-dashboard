// This is sample code. Please update this to suite your schema
const AWS = require("aws-sdk");
const cognitoIdentity = new AWS.CognitoIdentity();

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  let IdentityId = await getCognitoIdentityId(
    event.authorizationToken.replace("prefix-", "")
  );
  console.log("identityid", IdentityId);
  // const {
  //   authorizationToken,
  //   requestContext: { apiId, accountId },
  // } = event;
  // const response = {
  //   isAuthorized: authorizationToken === 'custom-authorized',
  //   resolverContext: {
  //     userid: 'user-id',
  //     info: 'contextual information A',
  //     more_info: 'contextual information B',
  //   },
  //   deniedFields: [
  //     `arn:aws:appsync:${process.env.AWS_REGION}:${accountId}:apis/${apiId}/types/Event/fields/comments`,
  //     `Mutation.createEvent`,
  //   ],
  //   ttlOverride: 300,
  // };
  // console.log(`response >`, JSON.stringify(response, null, 2));
  // return response;
};

// https://stackoverflow.com/questions/70666370/how-to-fetch-amazon-cognito-identity-id-user-identity-id-for-the-user-from-the
async function getCognitoIdentityId(jwtToken) {
  const params = getCognitoIdentityIdParams(jwtToken);
  return cognitoIdentity
    .getId(params)
    .promise()
    .then((data) => {
      if (data.IdentityId) {
        return data.IdentityId;
      }
      throw new Error("Invalid authorization token.");
    });
}

function getCognitoIdentityIdParams(jwtToken) {
  const loginsKey = `cognito-idp.${process.env.REGION}.amazonaws.com/${process.env.USERPOOLID}`;
  return {
    IdentityPoolId: `${process.env.IDENTITY_POOL_ID}`,
    Logins: {
      [loginsKey]: jwtToken,
    },
  };
}
