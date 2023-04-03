// import { Authenticator } from "@aws-amplify/ui-react";
import ResponsiveAppBar from "./components/nav/Navbar";
import PatientPage from "./components/patient/PatientPage";
import EventsTable from "./components/patient/EventsTable";
// import "@aws-amplify/ui-react/styles.css";
import "./App.css";
import ScoreChart, { RangeChart } from "./components/patient/Charts";
import Execute from "./components/mockData/populateDBScript";
import { Container } from "@mui/system";
import Patient from "./pages/patient";
import Navbar from "./components/nav/Navbar";
import Box from "@mui/material/Box";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { TestDetails } from "./pages/TestDetails";
import { Auth , Hub} from 'aws-amplify';
// import "@aws-amplify/ui-react/styles.css";
import AuthenticationPage from "./pages/Authentication";
import { PatientsTable } from "./components/patient_list/PatientsTable";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  redirect,
  useLocation,
  Navigate,
  Outlet,
  Router,
  BrowserRouter,
} from "react-router-dom";
import React from "react";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";

Amplify.configure(awsconfig);

function App() {
  const [loginState, setLoginState] = React.useState(false);

  const theme = createTheme();

  async function setAuthListener() {
    Hub.listen('auth', (listenerData) => {
      switch (listenerData.payload.event) {
        case "signOut":
          // console.log("signOut")
          setLoginState(false);
          break;
        case "signIn":
          // console.log("signIn")
          setLoginState(true);
          break;
        default:
          break;
      }
      
    });
  }

  React.useEffect(() => {
    setAuthListener();
  }, [])

  React.useEffect(() => {
    console.log("Login state (App): ", loginState);
    
    const { userInfo } = Auth.currentAuthenticatedUser()
                        .then((user) => {
                          setLoginState(true);
                      
                        }).catch((err) => {
                          setLoginState(false);
                          console.log(err);
                        });
    

  }, [loginState]);
  
  return (
    <>
      {loginState == true ? (
        <BrowserRouter>
          <Navbar loginState={loginState} setLoginState={setLoginState} />
          <ThemeProvider theme={theme}>
            

            <Container maxWidth="lg">
              <Routes>
                <Route path="/" element={<AuthenticationPage />} />
                <Route index path="/patientTable" element={<PatientsTable />} />
                <Route
                  path="patient/:patient_id"
                  element={
                    <PatientPage />
                  }
                />
                <Route
                  path="testDetails/:patient_id/:test_event_id"
                  element={<TestDetails />}
                  exact
                />
                <Route path="executeApi" element={<Execute />} />

                {/* Using path="*"" means "match anything", so this route
                    acts like a catch-all for URLs that we don't have explicit
                    routes for. */}
                <Route
                  path="*"
                  element={<Box sx={{display: 'flex', justifyContent: 'center'}}>Sorry, you've reached an unavailable page</Box>}
                />
              </Routes>
            </Container>
          </ThemeProvider>
        </BrowserRouter>
      ) : (
        <BrowserRouter>
          <Navbar />
          <ThemeProvider theme={theme}>
            <Container maxWidth="lg">

              <Routes>
                <Route index path="/" element={<AuthenticationPage />} />
                <Route
                  path="*"
                  element={<Box>Sorry, you've reached an unavailable page</Box>}
                />
              </Routes>

            </Container>
          </ThemeProvider>
        </BrowserRouter>
      )} 
    </>
  );
}

export default App;
