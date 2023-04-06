/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = (event, context, callback) => {
  console.log("event", event);
  console.log("context", context);
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        user_type:
          event.request.userAttributes["custom:user_type"] == "careProvider"
            ? "careProvider"
            : "patient",
      },
    },
  };

  callback(null, event);
};
