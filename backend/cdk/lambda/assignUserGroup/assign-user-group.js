const AWS = require("aws-sdk");
exports.handler = async (event, context, callback) => {
  // const AWS = require("aws-sdk");
  // const cognito_isp = require("@aws-sdk/cognito-identity-provider");

  const cognito_isp = new AWS.CognitoIdentityServiceProvider({
    apiVersion: "2016-04-18",
  });

  let params = {};

  // console.log("Event: ", event);
  // console.log("Context: ", context);

  if (event.request.userAttributes["custom:user_type"]) {
    if (event.request.userAttributes["custom:user_type"] == "careProvider") {
      params = {
        GroupName: "careProvider",
        UserPoolId: event.userPoolId,
        Username: event.userName,
      };
    }
  } else {
    params = {
      GroupName: "patient",
      UserPoolId: event.userPoolId,
      Username: event.userName,
    };
  }
  try {
    await cognito_isp.adminAddUserToGroup(params, (err) => {
      if (err) {
        console.log(err);
        callback(err);
      }
    });
    callback(null, event);
  } catch (err) {
    console.log(err);
    callback(err);
  }
};
