const AWS = require("aws-sdk");
exports.handler = async (event, context, callback) => {
  const cognito_isp = new AWS.CognitoIdentityServiceProvider({
    apiVersion: "2016-04-18",
  });

  let params = {};

  if (event.request.userAttributes["custom:if_dashboard_signup"]) {
    // if user signed up through dashbaord
    if (event.request.userAttributes["custom:if_dashboard_signup"] == "true") {
      // do nothing
      callback(null, event);
    }
  }
  // if user signed up through the app
  else {
    params = {
      GroupName: "patient",
      UserPoolId: event.userPoolId,
      Username: event.userName,
    };
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
  }
};
