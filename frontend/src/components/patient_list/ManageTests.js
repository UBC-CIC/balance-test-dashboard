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

import { Amplify, API, graphqlOperation } from "aws-amplify";
import awsconfig from "../../aws-exports";
import {
  assignTestToPatient,
  removeTestFromPatient,
} from "../../graphql/mutations";
import { getPatientAssignedTests } from "../../graphql/queries";
Amplify.configure(awsconfig);

const movement_tests = ["Sit-to-Stand", "Movement 2", "Movement 3"]; // modify the movement names if needed

export default function ManageTests({
  rowNum,
  user_id,
  patientDataRowsArr,
  updatePatientDataRowsArr,
}) {
  const [modalOpen, setModalOpen] = React.useState(false);

  const checkboxInitStateObj = {};
  for (let i in movement_tests) {
    checkboxInitStateObj[movement_tests[i]] = false;
  }

  const [checkboxStates, setCheckboxStates] =
    React.useState(checkboxInitStateObj);
  const [prevCheckboxStates, setPrevCheckboxStates] =
    React.useState(checkboxInitStateObj);

  async function sendTestToPatient(testStr) {
    try {
      console.log("in sendTestToPatient try block");
      let response = await API.graphql(
        graphqlOperation(assignTestToPatient, {
          patient_id: user_id,
          test_type: testStr,
        })
      );

      console.log("assignTestToPatient Response: ");
      console.log(response["data"]);
    } catch (err) {
      console.log(err);
      return new Promise((resolve, reject) => reject(err));
    }
  }

  async function deleteTestFromPatient(testStr) {
    try {
      console.log("in sendTestToPatient try block");
      let response = await API.graphql(
        graphqlOperation(removeTestFromPatient, {
          patient_id: user_id,
          test_type: testStr,
        })
      );

      console.log("removeTestFromPatient Response: ");
      console.log(response["data"]);
    } catch (err) {
      console.log(err);
      return new Promise((resolve, reject) => reject(err));
    }
  }

  async function retrieveAssignedTests() {
    try {
      console.log("in retrieveAssignedTests try block");
      let response = await API.graphql(
        graphqlOperation(getPatientAssignedTests, {
          patient_id: user_id,
        })
      );

      console.log("getPatientAssignedTests Response: ");
      console.log(response["data"]);

      let testsArr = [];
      response["data"]["getPatientAssignedTests"].map((test_info) => {
        testsArr.push(test_info["test_type"]);
      });
      console.log(testsArr);

      for (const checkboxKey of Object.keys(checkboxStates)) {
        if (testsArr.includes(checkboxKey.toLowerCase())) {
          setCheckboxStates({
            ...checkboxStates,
            [checkboxKey]: true,
          });
        } else {
          setCheckboxStates({
            ...checkboxStates,
            [checkboxKey]: false,
          });
        }
      }
      console.log(checkboxStates);
    } catch (err) {
      console.log(err);
      return new Promise((resolve, reject) => reject(err));
    }
  }

  const handleOpenModal = () => {
    // setCheckboxStates(checkboxInitStateObj);
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

    console.log("Checked: " + event.target.checked);
  };

  const handleSaveTests = () => {
    let countTrues = Object.values(checkboxStates).filter(Boolean).length;

    // console.log("Checkbox States: " + checkboxStates)

    //send dict obj to database to show which tests are true/false
    patientDataRowsArr[rowNum].assigned_test_num = countTrues;
    let updatedArr = patientDataRowsArr.slice();
    updatePatientDataRowsArr(updatedArr);

    console.log(checkboxStates);
    setModalOpen(false);
    setPrevCheckboxStates(checkboxStates);

    for (const [checkboxKey, checkboxValue] of Object.entries(checkboxStates)) {
      if (checkboxValue == true) {
        console.log(checkboxKey.toLowerCase());
        sendTestToPatient(checkboxKey.toLowerCase());
      } else {
        deleteTestFromPatient(checkboxKey.toLowerCase());
      }
    }
  };

  React.useEffect(() => {
    retrieveAssignedTests().then(() => {
      patientDataRowsArr[rowNum].assigned_test_num =
        Object.values(checkboxStates).filter(Boolean).length;
    });
  }, []);

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
          {movement_tests.map((movement_test) => {
            // console.log("Checked: " + movement_test + "-" + checkboxStates[movement_test])
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
