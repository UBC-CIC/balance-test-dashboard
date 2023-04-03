export type AmplifyDependentResourcesAttributes = {
  "api": {
    "balancetestdashboard": {
      "GraphQLAPIEndpointOutput": "string",
      "GraphQLAPIIdOutput": "string"
    }
  },
  "auth": {
    "balancetestdashboard733fb088": {
      "AppClientID": "string",
      "AppClientIDWeb": "string",
      "IdentityPoolId": "string",
      "IdentityPoolName": "string",
      "UserPoolArn": "string",
      "UserPoolId": "string",
      "UserPoolName": "string"
    },
    "userPoolGroups": {
      "careProviderGroupRole": "string",
      "patientGroupRole": "string"
    }
  },
  "function": {
    "balancetestdashboard733fb088PostConfirmation": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "balancetestdashboard733fb088PreTokenGeneration": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "graphQlLambdaAuthorizera86a1dbf": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    }
  },
  "storage": {
    "balanceTestS3": {
      "BucketName": "string",
      "Region": "string"
    }
  }
}