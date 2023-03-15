import { Authenticator, useAuthenticator, useTheme } from '@aws-amplify/ui-react';
import { Amplify, API, Auth, graphqlOperation } from 'aws-amplify';
import React from 'react';
import { NavBar } from '../components/nav/Navbar';
import awsconfig from "../aws-exports";
import { redirect, useNavigate } from "react-router-dom";
import { PatientsTable } from "../components/patient_list/PatientsTable"
import Signin from "../components/nav/SignIn";

import "./authentication.css";

Amplify.configure(awsconfig);

export default function AuthenticationPage() {

    //to override certain authentication functions
    // const authServices = {
    //     async handleSignUp(formData) {
    //         let { username, password, attributes } = formData;
    //         console.log("Auth Form Data: ", formData);

    //         username = username.toLowerCase(); //username field is email in this case
    //         attributes.email = attributes.email.toLowerCase();

    //         return Auth.signUp({
    //           username,
    //           password,
    //           attributes,
    //           autoSignIn: {
    //             enabled: true,
    //           },
    //         });
    //     },
    //     async handleSignIn(formData) {
    //         let { email, password } = formData;
    //         let allowSignIn = false;

    //         // return Auth.signIn(email, password).then((res) => {
    //         //     console.log("Sign In response: ", res);

    //         //     let userGroupArr = res["signInUserSession"]["accessToken"]["payload"]["cognito:groups"]

    //         //     if (userGroupArr.includes("care_provider_user")) {
    //         //         console.log("Is a care provider");
    //         //         return (
    //         //             <>
    //         //                 <PatientsTable careProviderId={1} />
    //         //             </>
    //         //         )
    //         //     } else {
    //         //         console.log("Not a care provider");
    //         //     }
    //         // });
    //     }
    // }

    return (
        // <Authenticator services={authServices}>
        <Authenticator>
            {({ signOut, user}) => {

                // console.log(user);

                let userGroupArr = user["signInUserSession"]["accessToken"]["payload"]["cognito:groups"]

                // if (userGroupArr.includes("care_provider_user")) {
                return (
                    <>
                        <PatientsTable careProviderId={1} />
                        <button onClick={signOut}>Sign out</button>
                    </>
                )
                // } else {
                //     return signOut()
                // }
            }}
        </Authenticator>
    )
}