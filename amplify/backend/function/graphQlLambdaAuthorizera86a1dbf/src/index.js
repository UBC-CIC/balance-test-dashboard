const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  const {
    authorizationToken,
    requestContext: {
      variables: { patient_id },
    },
  } = event;

  const identityId = jwt.decode(authorizationToken)["custom:identity_id"];
  const userType = jwt.decode(authorizationToken)["user_type"];

  const response = {
    isAuthorized: userType == "careProvider" || patient_id === identityId,
    ttlOverride: 0,
  };
  return response;
};
