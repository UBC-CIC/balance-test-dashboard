if (!process.env.USER_BRANCH || !process.env.USER_BRANCH.startsWith("prod"))
  return;

const region = process.env.REGION;
const parameter = JSON.parse(fs.readFileSync(config.filePath));
const overrideConfig = config.override["production"];
fs.writeFileSync(
  config.filePath,
  JSON.stringify({
    ...parameter,
    ...overrideConfig,
  })
);
