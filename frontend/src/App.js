import { Authenticator } from "@aws-amplify/ui-react";
import ResponsiveAppBar from "./components/nav/Navbar";
import PatientPage from "./components/patient/PatientPage";
import EventsTable from "./components/patient/EventsTable";
import "@aws-amplify/ui-react/styles.css";
import "./App.css";
import ScoreChart, { RangeChart } from "./components/patient/Charts";
import Execute from "./components/mockData/populateDBScript";
import { Container } from "@mui/system";
import Patient from "./pages/patient";
import Navbar from "./components/nav/Navbar";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { TestDetails } from "./pages/TestDetails";
import SignIn from "./components/nav/SignIn";
import SignUp from "./components/nav/SignUp";
import { PatientsTable } from "./components/patient_list/PatientsTable";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
  Outlet,
  Router,
  BrowserRouter,
} from "react-router-dom";

function App() {
  // [authState, setAuthState] = useState();

  // return authState === AuthState.SignedIn && user ? (
  //   <ThemeProvider theme={theme}>
  //     <UserContext.Provider value={user}>
  //       <div className="App">
  //         <Navigation
  //           isLoading={isLoading}
  //           userName={user.username}
  //           userId={user.userId}
  //           userDetail={userDetail}
  //           patients={patients}
  //           authState={authState}
  //         />
  //       </div>
  //     </UserContext.Provider>
  //   </ThemeProvider>
  // ) : (
  //   <div className="App">
  //     <ResponsiveAppBar />
  //     <Authenticator>
  //       {({ signOut, user }) => (
  //         <main>
  //           <h1>Hello {user.username}</h1>
  //           <button onClick={signOut}>Sign out</button>
  //         </main>
  //       )}
  //     </Authenticator>
  //   </div>
  // );
  const theme = createTheme();
  // return (
  //   <ThemeProvider theme={theme}>
  //     <Navbar />

  //     <Container maxWidth="lg">
  //       {/* <PatientPage /> */}
  //       <TestDetails />
  //     </Container>
  //   </ThemeProvider>
  // );
  // return <SignUp />;
  // return <PatientsTable />;
  // return <EventsTable />;
  // return <ScoreChart />;
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Navbar />

        <Container maxWidth="lg">
          <Routes>
            {/* <Route path="/" element={<SignIn />}> */}
            <Route index element={<PatientsTable careProviderId="1" />} />
            <Route
              path="patient"
              element={
                <PatientPage
                  // 217016f5-3dbf-41b3-8438-b414c2a95f0d
                  patient_id={"217016f5-3dbf-41b3-8438-b414c2a95f0d"}
                  patient_name={"Albert Pham"}
                />
              }
            />
            <Route
              path="patientTable"
              // 1 is current hard-coded care_provider_id
              element={<PatientsTable careProviderId="1" />}
            />
            <Route path="signIn" element={<SignIn />} />
            <Route path="signUp" element={<SignUp />} />
            <Route
              path="testDetails"
              element={
                <TestDetails
                  patient_id={"217016f5-3dbf-41b3-8438-b414c2a95f0d"}
                  patient_name={"Albert Pham"}
                />
              }
            />
            <Route path="executeApi" element={<Execute />} />

            {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
            <Route
              path="*"
              element={<div>Sorry, you've reached an unavailable page</div>}
            />
            {/* </Route> */}
          </Routes>
        </Container>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
