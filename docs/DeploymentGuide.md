# Deployment Guide


| Index                                                      | Description                                               |
|:-----------------------------------------------------------|:----------------------------------------------------------| 
| [Install Dependencies](#step-1-install-dependencies)       | Install required npm core dependencies                    |
| [CDK Deployment Part 1](#step-2-cdk-deployment-part-1)                   | How to deploy the backend cdk stacks part 1                     |
| [Amplify Deployment](#step-3-amplify-deployment)                   | How to deploy the amplify website                      |
| [CDK Deployment Part 2](#step-4-cdk-deployment-part-2)                   | How to deploy the backend cdk stacks part 2                     |


## Step 1: Install Dependencies
The `backend` folder contains AWS CDK stacks and AWS Lambda function code that will manage the data stores and corresponding interactions with the dashboard.

First, run `cd backend` to ensure you are in the backend directory, then install the core dependencies:
```
npm install
```

If this command gives you an error, run the following commands instead:
```
rm package-lock.json
npm install
```

TODO: verify this
Install dependencies required by the AWS Lambda functions. Note that this generates a separate `node_modules` directory in the `src` folder. This is done because everything under the `src` folder will be uploaded to AWS Lambda and we want to exclude the packages (e.g. `aws-sdk`) that already comes with AWS Lambda:
```
cd cdk/lambda
npm install
cd ../..
```

## Step 2: CDK Deployment Part 1
Initialize the CDK stacks (required only if you have not deployed this stack before).
```
cdk synth --profile balance-test
todo: needed?
cdk bootstrap aws://YOUR_AWS_ACCOUNT_ID/us-west-2 --profile balance-test
```

If the cdk synth command gives you an error, run your console as administrator and execute the following command: 
```
Set-ExecutionPolicy RemoteSigned
```

TODO: verify the time
Deploy the CDK stacks (this will take 30-40 minutes):

TODO: troubleshooting md
If you run into any issues while deploying, refer to [Troubleshooting](#troubleshooting) for solutions.

```
cdk deploy CognitoStack --profile health-platform
cdk deploy VPCStack --profile health-platform
cdk deploy DataWorkflowStack --profile health-platform
cdk deploy DatabaseStack --profile health-platform
cdk deploy AthenaGlueStack --profile health-platform
cdk deploy AppsyncStack --profile health-platform
```
## Step 3: Amplify Deployment
Before deploying the Amplify Website we need to create the IAM Role that associate the policies needed to implement this solution. Ensure you have navigated to the frontend directory and run the following command.

```
aws cloudformation deploy --template-file cfn-amplifyRole.yaml --stack-name amplifyconsole-balancetest-backend-role --capabilities CAPABILITY_NAMED_IAM --profile balance-test
```

The command creates the role name **amplifyconsole-balancetest-backend-role** that will be used on the next step.

Ensure you are logged into your AWS account and click the Deploy To Amplify Console button to begin the website deployment.

[![amplifybutton](https://oneclick.amplifyapp.com/button.svg)](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/UBC-CIC/balance-test/)

The following page will appear after clicking the button. Click the connect to Github button and connect to your Github account.

<!-- ![alt text](/docs/images/deployment_guide/amplify_1.PNG) -->

After connecting your Github account this window should appear. Click save and deploy to begin the deployment.

<!-- ![alt text](/docs/images/deployment_guide/amplify_2.PNG) -->

Next, click general in the sidebar and click edit in the top right corner. Open the Service Role dropdown menu and select the **amplifyconsole-balancetest-backend-role** that we created. Finish by clicking save. If you attach the role too slowly, the build will fail the first time. If this happens, ensure the role has been attached, click main, then click redeploy this version.

<!-- ![alt text](/docs/images/deployment_guide/amplify_6.PNG) -->

The deployment will take a few minutes. Wait until the status of Verify is green.

<!-- ![alt text](/docs/images/deployment_guide/amplify_3.PNG) -->

Next click on Rewrites and redirects from the sidebar and click edit.

- You will need to set up an Amplify rewrite condition with the following settings:
    - Source address: ```</^((?!\.(css|gif|ico|jpg|js|png|txt|svg|woff|ttf)$).)*$/>```
    - Target address: ```/index.html```
    - Type: ```200 (Rewrite)```

Refer to [AWS's Page on Single Page Apps](https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html#redirects-for-single-page-web-apps-spa) for further information why this is necessary.

It should look like this after you have added the above require condition.

<!-- ![alt text](/docs/images/deployment_guide/amplify_4.PNG) -->

Your webapp is now partially deployed, but before it's accessible, we need to finish the rest of the CDK deployment.

<!-- ![alt text](/docs/images/deployment_guide/amplify_5.png) -->

## Step 4: CDK Deployment Part 2
Make sure you are in the cdk folder, then run:
```
cdk deploy DatabaseStack --profile health-platform
cdk deploy AthenaGlueStack --profile health-platform
cdk deploy AppsyncStack --profile health-platform
```
