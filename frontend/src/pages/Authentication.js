import {
  Authenticator,
  useAuthenticator,
  useTheme,
} from "@aws-amplify/ui-react";
import { Amplify, API, Auth, Hub, graphqlOperation } from "aws-amplify";
import React from "react";
import { NavBar } from "../components/nav/Navbar";
import awsconfig from "../aws-exports";
import { redirect, useNavigate, Link } from "react-router-dom";
import { PatientsTable } from "../components/patient_list/PatientsTable";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import { createCareProvider } from "../graphql/mutations";

import "./authentication.css";
Amplify.configure(awsconfig);

export default function AuthenticationPage() {
  const [showAccessDenied, setShowAccessDenied] = React.useState(false);
  const navigate = useNavigate();

  const handleDeniedClose = () => {
    setShowAccessDenied(false);
  };

  //to override certain authentication functions
  const authServices = {
    async handleSignUp(formData) {
      let { username, password, attributes } = formData;

      username = username.toLowerCase(); //username field is email in this case
      attributes.email = attributes.email.toLowerCase();
      attributes["custom:user_type"] = "careProvider";
      attributes["custom:identity_id"] = "null";

      return Auth.signUp({
        username,
        password,
        attributes,
        autoSignIn: {
          enabled: true,
        },
      });
    },
  };

  async function makeCareProvider(email) {
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;

    let userCreds = await Auth.currentUserCredentials();
    let identity_id = userCreds["identityId"];

    try {
      identity_id = identity_id.split(":")[1]; //get id without the region

      let response = await API.graphql({
        query: createCareProvider,
        variables: {
          care_provider_id: identity_id,
          email: email,
        },
        authToken: idtoken,
      });
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <Box>
      <Authenticator services={authServices}>
        {({ signOut, user }) => {
          let userGroupArr =
            user["signInUserSession"]["accessToken"]["payload"][
              "cognito:groups"
            ];
          let user_id = user["username"];
          let email = user["attributes"]["email"];

          if (!userGroupArr) {
            console.log("backend authentication error");
            Auth.signOut();
          } else if (userGroupArr.includes("careProvider")) {
            navigate("/patientTable");
            makeCareProvider(email);
          } else {
            Auth.signOut();
            setShowAccessDenied(true);
          }
        }}
      </Authenticator>
      <Snackbar
        open={showAccessDenied}
        autoHideDuration={5000}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        onClose={handleDeniedClose}
        message="No Permissions to Access."
      />
    </Box>
  );
}
