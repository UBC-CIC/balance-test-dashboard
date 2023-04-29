# Clean Up Guide

| Index                         | Description                                                   |
| :---------------------------- | :------------------------------------------------------------ |
| [CDK Deletion](#cdk-deletion) | Describes how to clean up CDK resources after finishing usage |
| [Sagemaker](#sagemaker)       | Section about deleting Sagemaker endpoint                     |

# CDK Deletion

First, from the project root directory, to make sure you are in the `balance-test-dashboard/backend/cdk` directory, do the following in the terminal:

```
cd balance-test-dashboard/backend/cdk
```

Also, the commands use the same profile that you used for deploying the project (eg. `balance-test`). If your profile is a different name, replace the profile name in the commands below with your profile name when you use `--profile`.

When prompted with `Are you sure you want to delete: STACK_NAMES`, <u>**double check**</u> that only the stack names that you want to delete are there, then enter `y`. For example, stack names are:

`AppsyncStack, AthenaGlueStack, DataWorkflowStack, DatabaseStack, CognitoStack, VPCStack`

To delete the stacks individually, you use the following commands in the following order (reverse from deployment order):

```
cdk destroy AppsyncStack --profile balance-test
```

After this step, you would need to go to the Amplify service in the AWS console to [delete the Amplify app (guide)](https://repost.aws/knowledge-center/amplify-delete-application). Then, delete the below stacks:

```
cdk destroy AthenaGlueStack --profile balance-test
```

```
cdk destroy DataWorkflowStack --profile balance-test
```

```
cdk destroy DatabaseStack --profile balance-test
```

```
cdk destroy CognitoStack --profile balance-test
```

```
cdk destroy VPCStack --profile balance-test
```

You can also go to your AWS console using the account that the CDK stacks were deployed to, and search for `CloudFormation` in the search bar. You can individually delete stacks and monitor stack deletion/creation on AWS CloudFormation as well.

Note that because the **S3 buckets** and **RDS database** may contain lots of <u>**sensitive data**</u>, these resources are retained and not deleted during CDK deletion, so that the data is not lost.

If you want to delete them, you can follow this AWS documentation guide for [deleting S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/delete-bucket.html) and [deleting RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DeleteInstance.html)

Also, note that the CloudWatch Logs deployed from CDK are retained for 2 years as the default, which would be helpful for diagnosing issues as it states on the AWS documentation.

You can go to AWS console and find the following log groups to delete, which would include a variation of "Balance Test" in their names:

`/aws/lambda/BalanceTest-AthenaQueryS3-Logs, /aws/lambda/BalanceTest-postgresqlRDSConnect-Logs, /aws/lambda/BalanceTest-S3LambdaTrigger-Logs, /aws/lambda/BalanceTest-generateReportLambda-Logs, /aws/lambda/BalanceTest-deleteS3RecordLambda-Logs, /aws/sagemaker/BalanceTest-SagemakerExecution-Logs`

You can use the CLI to delete the log group as well:

```
aws logs delete-log-group --log-group-name LOG_GROUP_NAME --profile balance-test
```

# Sagemaker

## Delete Sagemaker Endpoint (**IMPORTANT**)

This can be separately deleted from the CDK stacks.

To prevent further usage, the Sagemaker endpoint resource needs to be cleaned up and made inactive. Please enter the following commands in your terminal where [AWS CLI](https://aws.amazon.com/cli/) is installed.

This assumes that you have not changed the Sagemaker endpoint name (`balance-test-multimodel`) in the DataWorkflowStack. If you have deployed the endpoint with a different name, enter that as the value after `--endpoint-name`.

```
aws sagemaker delete-endpoint --endpoint-name balance-test-multimodel --profile balance-test
```

This assumes that you have not changed the Sagemaker endpoint configuration and model names. If you have, enter those names for `--endpoint-config-name` and `--model-name`, respectively.

```
aws sagemaker delete-endpoint-config --endpoint-config-name balance-test-multimodel --profile balance-test
```

```
aws sagemaker delete-model --model-name balance-test-multimodel --profile balance-test
```

To double check and verify whether the endpoint, endpoint configuration, and model were deleted, you can check the Sagemaker service in the AWS console of that profile.
<break>

You can also choose to delete those resources from the console as well by clicking on the item you want to delete, clicking on "Actions" to reveal a drop-down menu, clicking "Delete" from that menu will pop up a deletion confirmation, and clicking "Delete" to confirm that deletion.

You can refer to this [AWS documentation guide for deleting Sagemaker endpoints](https://docs.aws.amazon.com/sagemaker/latest/dg/realtime-endpoints-delete-resources.html) too.
