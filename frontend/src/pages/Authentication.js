import {
  Authenticator,
  useAuthenticator,
  useTheme,
} from "@aws-amplify/ui-react";
import { Amplify, API, Auth, Hub, graphqlOperation } from "aws-amplify";
import React from "react";
import { NavBar } from "../components/nav/Navbar";
import awsconfig from "../aws-exports";
import { redirect, useNavigate } from "react-router-dom";
import { PatientsTable } from "../components/patient_list/PatientsTable";
import Signin from "../components/nav/SignIn";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import "./authentication.css";

Amplify.configure(awsconfig);

export default function AuthenticationPage() {
  const [showAccessDenied, setShowAccessDenied] = React.useState(false);

  const handleDeniedClose = () => {
    setShowAccessDenied(false);
  };

  //to override certain authentication functions
  const authServices = {
    async handleSignUp(formData) {
      let { username, password, attributes } = formData;

      username = username.toLowerCase(); //username field is email in this case
      attributes.email = attributes.email.toLowerCase();
      attributes["custom:user_type"] = "care_provider_user";
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

  return (
    <Box>
      <Authenticator services={authServices}>
        {({ signOut, user }) => {
          console.log("User: ", user);

          // Auth.currentSession().then((res) => {
          //   console.log("ressession", res);
          //   let idToken = res.getIdToken().payload["cognito:identity-id"];
          //   console.log("idToken", idToken);
          // });

          let userGroupArr =
            user["signInUserSession"]["accessToken"]["payload"][
              "cognito:groups"
            ];
          let user_id = user["username"];

          Auth.currentUserCredentials().then((credentials) => {
            console.log("identityId", credentials.identityId);
            if (user["attributes"]["custom:identity_id"] == "null") {
              console.log("1");
              Auth.updateUserAttributes(user, {
                ["custom:identity_id"]: credentials.identityId,
              }).then((res) => {});
            }
          });

          // remove this
          if (
            userGroupArr.includes("care_provider_user") ||
            userGroupArr.includes("patient_user")
          ) {
            return (
              <>
                <PatientsTable careProviderId={user_id} />
                <button onClick={signOut}>Sign out</button>
              </>
            );
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
