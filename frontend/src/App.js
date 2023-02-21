import { Authenticator } from "@aws-amplify/ui-react";
import ResponsiveAppBar from "./components/nav/Navbar";
import PatientPage from "./components/patient/PatientPage";
import EventsTable from "./components/patient/EventsTable";
import "@aws-amplify/ui-react/styles.css";
import "./App.css";
import ScoreChart from "./components/patient/Charts";
import { Container } from "@mui/system";
import Patient from "./pages/patient";
import Navbar from "./components/nav/Navbar";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { TestDetails } from "./pages/TestDetails";
import SignIn from "./components/nav/SignIn";
import SignUp from "./components/nav/SignUp";

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
  return <SignUp />;
  // return <EventsTable />;
  // return <ScoreChart />;
}

export default App;
