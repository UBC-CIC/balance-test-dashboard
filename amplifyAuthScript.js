// if (!process.env.USER_BRANCH || !process.env.USER_BRANCH.startsWith("prod"))
//   return;

// const parameter = JSON.parse(fs.readFileSync(config.filePath));
// const overrideConfig = config.override["production"];
// fs.writeFileSync(
//   config.filePath,
//   JSON.stringify({
//     ...parameter,
//     ...overrideConfig,
//   })
// );

const fs = require("fs");
const region = process.env.REGION;
const authParametersPath =
  "./amplify/backend/auth/balancetestdashboardf52840bc/parameters.json";
const parameters = JSON.parse(
  fs.readFileSync(authParametersPath, {
    encoding: "utf8",
  })
);

parameters.region = process.env.REGION;

console.log("rewriting auth region");
fs.writeFileSync(authParametersPath, JSON.stringify(parameters, null, 2));
console.log("rewrite succeeded");
