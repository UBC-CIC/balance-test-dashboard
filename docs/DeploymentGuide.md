# Deployment Guide

| Index                                                                    | Description                                 |
| :----------------------------------------------------------------------- | :------------------------------------------ |
| [Requirements](#requirements)                                            | The requirements needed before deploying    |
| [Cloning Repository](#step-1-cloning-the-repository)                     | Place the project inside your machine       |
| [Install Dependencies](#step-2-install-dependencies)                     | Install required npm core dependencies      |
| [CDK Deployment Part 1](#step-3-cdk-deployment-part-1)                   | How to deploy the backend cdk stacks part 1 |
| [Amplify Deployment](#step-4-amplify-deployment)                         | How to deploy the amplify website           |
| [CDK Deployment Part 2 - AppSync](#step-5-cdk-deployment-part-2-appsync) | How to deploy the backend cdk stacks part 2 |
| [Clean-Up Resources](#clean-up-resources)                                | A guide on deleting resources               |

# Requirements

Before you deploy, you must have the following installed on your device:

- [GitHub Account](https://github.com/)
- [Git](https://git-scm.com/)
- [AWS Account](https://aws.amazon.com/account/)
- [AWS CLI](https://aws.amazon.com/cli/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/cli.html)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

If you do not currently have a configured AWS Account, configure an account with the following instructions:

- Configure the AWS CLI tool for your AWS Account in the region of choice, using a user with programmatic access and the "AdministratorAccess" policy (moving forward, we will assume you have [configured a profile](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/configure/index.html) called `balance-test`):
  > `aws configure --profile balance-test`

If you already have a configured AWS account, you may use your own configured account to deploy. Please note that if you decide to use your own account to deploy, be sure to change our command line commands to use your profile whenever there is a `--profile` command.

```
--profile YOUR_AWS_PROFILE_HERE
```

**Once you have downloaded Docker Desktop, launch it and set up the application. Once the application is set up, leave it running.**

# Step 1: Cloning the Repository

First, clone the GitHub repository onto your machine. To do this:

1. Create a folder on your computer to contain the project code.

<!-- TODO: fix this: after you clone, the git project is within another folder that's generated -->

2. To find the path to a folder on a Mac, right click on the folder and press `Get Info`, then select the whole text found under `Where:` and copy with ⌘C. On Windows (not WSL), enter into the folder on File Explorer and click on the path box (located to the left of the search bar), then copy the whole text that shows up.

3. For an Apple computer, open Terminal. If on a Windows machine, open Command Prompt or Windows Terminal. Enter the path of the folder you made using the command `cd path/to/folder`, where `path/to/folder` is the text you just copied.

4. Clone the GitHub repository by entering the following:

```bash
git clone https://github.com/UBC-CIC/balance-test-dashboard.git
```

# Step 2: Install Dependencies

The `backend` folder contains AWS CDK stacks and AWS Lambda function code that will manage the data stores and corresponding interactions with the dashboard.

```
npm install
```

If this command gives you an error, run the following commands instead:

```
rm package-lock.json
npm install
```

<!-- TODO: verify this
Install dependencies required by the AWS Lambda functions. Note that this generates a separate `node_modules` directory in the `src` folder. This is done because everything under the `src` folder will be uploaded to AWS Lambda and we want to exclude the packages (e.g. `aws-sdk`) that already comes with AWS Lambda:

```
cd cdk/lambda
npm install
cd ../..
``` -->

# Step 3: CDK Deployment Part 1

**Make sure Docker Desktop is open and finished with the setup process.**

Before deploying the stacks, from your project root directory, to ensure you are in the **cdk** folder of the backend section, run the below command in your terminal:

```
cd backend/cdk
```

In the `backend/cdk` directory, initialize the CDK stacks in the terminal (required only if you have not deployed the stacks before). The below lines assume your account profile is named `balance-test` and you want to deploy to that account.

```
cdk synth --profile balance-test
```

If the cdk synth command gives you an error, run your console as administrator and execute the following command:

```
Set-ExecutionPolicy RemoteSigned
```

After doing `cdk synth`, enter the following:

```
cdk bootstrap aws://YOUR_AWS_ACCOUNT_ID/YOUR_AWS_REGION --profile balance-test
```

Deploy the CDK stacks individually, you **must** deploy in the **following order**. The deployment will take about 50-60 minutes.
When prompted `Do you wish to deploy these changes (y/n)?`, type `y` and enter.

```
cdk deploy VPCStack --profile balance-test
```

```
cdk deploy CognitoStack --profile balance-test
```

After successfully deploying this stack, take a note of the output:
![alt text](/docs/images/cognito_output.PNG)

Then proceed with deploying the rest of the stacks by running:

```
cdk deploy DatabaseStack --profile balance-test
```

```
cdk deploy DataWorkflowStack --profile balance-test
```

```
cdk deploy AthenaGlueStack --profile balance-test
```

# Step 4: Amplify Deployment

If you're in the `backend/cdk` directory, go back to the project root directory.

```
cd ../..
```

Before deploying the Amplify Website, we need to create the IAM Role that associate the policies needed to implement this solution. Run the following command:

```
aws cloudformation deploy --template-file cfn-amplifyRole.yml --stack-name amplifyconsole-balancetest-backend-role --capabilities CAPABILITY_NAMED_IAM --profile balance-test
```

The command creates the role name **amplifyconsole-balancetest-backend-role** that will be used on the next step.

Ensure you are logged into your AWS account and are in the correct region. Click the Deploy To Amplify Console button to begin the website deployment.

[![amplifybutton](https://oneclick.amplifyapp.com/button.svg)](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/UBC-CIC/balance-test-dashboard/tree/main)

The following page will appear after clicking the button. Click the connect to Github button and connect to your Github account.

![alt text](/docs/images/amplify_home.PNG)

After connecting your Github account this window should appear.

![alt text](/docs/images/amplify_settings.PNG)

Select the **amplifyconsole-balancetest-backend-role** we made previously for the deployment role. Expand the "Environment variables" section and edit the environment variables to the following settings, replace the values starting with `//` with the output that you saved from previous. Make sure to replace the `us-east-2` with your region.

```
_LIVE_UPDATES: [{"name":"Amplify CLI","pkg":"@aws-amplify/cli","type":"npm","version":"10.7.2"}]
AMPLIFY_STORAGE_BUCKET_NAME: balancetest-datastorage-bucket
AMPLIFY_STORAGE_REGION: // region
AMPLIFY_USERPOOL_ID: // CognitoStack.UserPoolId
AMPLIFY_WEBCLIENT_ID: // CognitoStack.UserPoolClientId
AMPLIFY_NATIVECLIENT_ID: // CognitoStack.UserPoolClientId
AMPLIFY_IDENTITYPOOL_ID: // / CognitoStack.IdentityPoolId

```

![alt text](/docs/images/cognito_output.PNG)
![alt text](/docs/images/amplify_env.PNG)

Then, click the orange button "save and deploy". The deployment will take a few minutes. Wait until the status of Verify is green.

![alt text](/docs/images/amplify_success.PNG)

Next click on Rewrites and redirects from the sidebar and click edit.

- You will need to set up an Amplify rewrite condition with the following settings:
  - Source address: `</^((?!\.(css|gif|ico|jpg|js|png|txt|svg|woff|ttf)$).)*$/>`
  - Target address: `/index.html`
  - Type: `200 (Rewrite)`

Refer to [AWS's Page on Single Page Apps](https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html#redirects-for-single-page-web-apps-spa) for further information why this is necessary.

It should look like this after you have added the above require condition.

![alt text](/docs/images/amplify_rewrites.PNG)

Your webapp is now partially deployed, but before it's accessible, we need to finish the rest of the CDK deployment.

<!-- ![alt text](/docs/images/deployment_guide/amplify_5.png) -->

# Step 5: CDK Deployment Part 2, AppSync

If you are in the project root directory, make sure you are back in the `backend/cdk` directory in the terminal, so run:

```
cd backend/cdk
```

Then, assuming you have the above cdk stacks deployed, deploy this stack (it takes about 5 minutes):

```
cdk deploy AppsyncStack --profile balance-test
```

Your entire app is now deployed! Click on the generated Amplify link to open the webapp.
![alt text](/docs/images/amplify_link.PNG)

# Clean-Up Resources

When you do not want to use this project anymore and want to delete its resources, you can follow this guide on how to clean up the resources: [Clean-Up Guide](CleanUpGuide.md)
