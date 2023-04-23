module.exports = {
  auth: {
    authSelections: "identityPoolAndUserPool",
    resourceName: "balancetestdashboardf52840bc",
    serviceType: "imported",
    region: "ca-central-1",
    usernameAttributes: ["email"],
    requiredAttributes: ["given_name", "family_name"],
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [
      "Requires Lowercase",
      "Requires Uppercase",
      "Requires Numbers",
      "Requires Symbols",
    ],
    mfaConfiguration: "OFF",
    autoVerifiedAttributes: ["email"],
    mfaTypes: [],
  },
};
