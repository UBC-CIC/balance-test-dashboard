exports.handler = (event, context, callback) => {
  console.log("event", event);
  console.log("context", context);
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        user_type:
          event.request.userAttributes["custom:user_type"] ==
          "care_provider_user"
            ? "care_provider_user"
            : "patient_user",
      },
    },
  };

  callback(null, event);
};
