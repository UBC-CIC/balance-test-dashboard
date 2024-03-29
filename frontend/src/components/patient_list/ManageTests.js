import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import "./ManageTests.css";

import { Amplify, API, Auth, graphqlOperation } from "aws-amplify";
import awsconfig from "../../aws-exports";
import {
  assignTestToPatient,
  removeTestFromPatient,
} from "../../graphql/mutations";
import {
  getAllAvailableTests,
  getPatientAssignedTests,
} from "../../graphql/queries";
import { touchRippleClasses } from "@mui/material";
Amplify.configure(awsconfig);

export function initMovementsAssignedObj(movement_tests) {
  let checkboxInitStateObj = {};
  for (let i in movement_tests) {
    checkboxInitStateObj[movement_tests[i]] = false;
  }

  return checkboxInitStateObj;
}

export async function retrieveAssignedTests(user_id, movementTests) {
  let sesh = await Auth.currentSession();
  let idtoken = sesh.idToken.jwtToken;
  try {
    // console.log("in retrieveAssignedTests try block");
    let response = await API.graphql({
      query: getPatientAssignedTests,
      variables: {
        patient_id: user_id,
      },
      authToken: idtoken,
    });

    // console.log("getPatientAssignedTests Response: ");
    // console.log(response["data"]);

    let testsArr = [];
    response["data"]["getPatientAssignedTests"].map((test_info) => {
      testsArr.push(test_info["test_type"]);
    });
    // console.log(user_id, testsArr);

    let checkboxInitStateObj = {};

    // console.log("movementtests", movementTests);
    for (const movement of movementTests) {
      if (testsArr.includes(movement)) {
        checkboxInitStateObj[movement] = true;
      } else {
        checkboxInitStateObj[movement] = false;
      }
    }

    // let responseAvailableTests = await API.graphql({
    //   query: getAllAvailableTests,
    //   authToken: idtoken,
    // });

    // console.log("responseAvailableTests", responseAvailableTests);

    return checkboxInitStateObj;
  } catch (err) {
    console.log(err);
    return new Promise((resolve, reject) => reject(err));
  }
}
export function ManageTests({
  rowNum,
  user_id,
  patientDataRowsArr,
  updatePatientDataRowsArr,
  movementTests,
}) {
  const [modalOpen, setModalOpen] = React.useState(false);

  const checkboxInitStateObj = initMovementsAssignedObj(movementTests);

  const [checkboxStates, setCheckboxStates] =
    React.useState(checkboxInitStateObj);
  const [prevCheckboxStates, setPrevCheckboxStates] =
    React.useState(checkboxInitStateObj);

  React.useEffect(() => {
    retrieveAssignedTests(user_id, movementTests)
      .then((checkbox_obj) => {
        patientDataRowsArr[rowNum].assigned_test_num =
          Object.values(checkbox_obj).filter(Boolean).length;
        patientDataRowsArr[rowNum].movements_assigned = checkbox_obj;
        setCheckboxStates(checkbox_obj);
        updatePatientDataRowsArr(patientDataRowsArr.slice());
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  async function sendTestToPatient(testStr) {
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;

    try {
      // console.log("in sendTestToPatient try block");
      let response = await API.graphql({
        query: assignTestToPatient,
        variables: {
          patient_id: user_id,
          test_type: testStr,
        },
        authToken: idtoken,
      });

      // console.log("assignTestToPatient Response: ");
      // console.log(response["data"]);
    } catch (err) {
      console.log(err);
      return new Promise((resolve, reject) => reject(err));
    }
  }

  async function deleteTestFromPatient(testStr) {
    try {
      // console.log("in sendTestToPatient try block");

      let sesh = await Auth.currentSession();
      let idtoken = sesh.idToken.jwtToken;

      let response = await API.graphql({
        query: removeTestFromPatient,
        variables: {
          patient_id: user_id,
          test_type: testStr,
        },
        authToken: idtoken,
      });

      // console.log("removeTestFromPatient Response: ");
      // console.log(response["data"]);
    } catch (err) {
      console.log(err);
      return new Promise((resolve, reject) => reject(err));
    }
  }

  const handleOpenModal = () => {
    setCheckboxStates(patientDataRowsArr[rowNum].movements_assigned);
    setPrevCheckboxStates(patientDataRowsArr[rowNum].movements_assigned);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setCheckboxStates(prevCheckboxStates);
    setModalOpen(false);
  };

  const handleCheckbox = (event) => {
    setCheckboxStates({
      ...checkboxStates,
      [event.target.name]: event.target.checked,
    });
  };

  const handleSaveTests = () => {
    let countTrues = Object.values(checkboxStates).filter(Boolean).length;

    // console.log("Checkbox States: " + checkboxStates)

    //send dict obj to database to show which tests are true/false
    patientDataRowsArr[rowNum].assigned_test_num = countTrues;
    patientDataRowsArr[rowNum].movements_assigned = checkboxStates;
    let updatedArr = patientDataRowsArr.slice();
    updatePatientDataRowsArr(updatedArr);

    setModalOpen(false);
    setPrevCheckboxStates(checkboxStates);

    for (const [checkboxKey, checkboxValue] of Object.entries(checkboxStates)) {
      if (checkboxValue == true) {
        sendTestToPatient(checkboxKey.toLowerCase());
      } else {
        deleteTestFromPatient(checkboxKey.toLowerCase());
      }
    }
  };

  return (
    <div className="manage-button-div">
      <Button onClick={handleOpenModal}>Manage</Button>
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        scroll="paper"
      >
        <DialogTitle>Assign Tests</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ padding: "0 0 20px 0" }}>
            Select the movement(s) to assign to the patient.
          </DialogContentText>
          {movementTests.map((movement_test) => {
            return (
              <FormGroup key={movement_test}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkboxStates[movement_test]}
                      name={movement_test}
                    />
                  }
                  label={movement_test}
                  onChange={handleCheckbox}
                />
              </FormGroup>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleSaveTests}>Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
