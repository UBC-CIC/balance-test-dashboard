const postgresqlRDSConnectLambdaPolicyDocument = new iam.PolicyDocument({
  statements: [
    new iam.PolicyStatement({
      actions: [
        "logs:CreateLogStream",
        "logs:CreateLogGroup",
        "logs:PutLogEvents",
      ],
      resources: [postgresqlRDSConnectLambdaLogGroup.logGroupArn],
    }),
    new iam.PolicyStatement({
      actions: [
        "logs:CreateLogStream",
        "logs:CreateLogGroup",
        "logs:PutLogEvents",
      ],
      resources: [postgresqlRDSConnectLambdaLogGroup.logGroupArn],
    }),
    new iam.PolicyStatement({
      actions: [
        "ssm:DescribeParameters",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:PutParameter",
      ],
      resources: ["*"],
    }),
  ],
});
