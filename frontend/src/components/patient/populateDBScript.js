import { Amplify, API, graphqlOperation } from "aws-amplify";
import awsconfig from "../../aws-exports";
import { getPatients, getTestEvents } from "../../graphql/queries";
Amplify.configure(awsconfig);
