import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import { v4 as uuidv4, v5 as uuidv5 } from "uuid";
import { initMovementsAssignedObj, retrieveAssignedTests } from "./ManageTests";

import { Amplify, API, Auth, graphqlOperation } from "aws-amplify";
import awsconfig from "../../aws-exports";
import {
  getAllPatients,
  getPatientAssignedTests,
  getTestEvents,
} from "../../graphql/queries";
import {
  createPatient,
  addPatientToCareProvider,
} from "../../graphql/mutations";
Amplify.configure(awsconfig);

let searchPopOutData = [
  {
    user_id: 19285239,
    patient_name: "John Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 65,
  },
  {
    user_id: 23897593,
    patient_name: "Jane Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 45,
  },
  {
    user_id: 90258044,
    patient_name: "Robbie Mac",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 56,
  },
  {
    user_id: 29235305,
    patient_name: "Amanda Spence",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 23,
  },
];

function createPatientInfoObj(patientName) {
  console.log("New Patient Name: " + patientName);

  const newUserID = uuidv5(patientName, uuidv4()); //make a uuid with a name and random uuid

  let newPatientObj = {};
  let movementsAssignedObj = initMovementsAssignedObj();

  newPatientObj = {
    user_id: newUserID,
    patient_name: patientName,
    assigned_test_num: 0,
    last_movement_tested: "-",
    last_test_score: "-",
    movements_assigned: movementsAssignedObj,
  };
  return newPatientObj;
}

async function retrievePatientInfo(patientName, userID) {
  let sesh = await Auth.currentSession();
  let idtoken = sesh.idToken.jwtToken;

  console.log("Added Patient from DB: " + patientName + " " + userID);
  let newPatientObj = {};

  try {
    console.log("in retrievePatientInfo");

    let res1 = await API.graphql({
      query: getPatientAssignedTests,
      variables: {
        patient_id: userID,
      },
      authToken: idtoken,
    });
    console.log("res1_addPatient", res1);

    let res2 = await API.graphql({
      query: getTestEvents,
      variables: {
        patient_id: userID,
        sort: "desc",
        count: 1,
      },
      authToken: idtoken,
    }).catch((res) => {
      if (res == null) {
        return 0;
      }
    });
    console.log("res2_addPatient", res2);

    let lastMovementAssigned =
      res2 == null
        ? "-"
        : res2.data.getTestEvents.length == 0
        ? "-"
        : res2.data.getTestEvents[0]?.test_type;
    let balanceScore =
      res2 == null
        ? "-"
        : res2.data.getTestEvents.length == 0
        ? "-"
        : res2.data.getTestEvents[0]?.balance_score;
    let lastScore = balanceScore == null ? "-" : balanceScore;

    console.log("last score: ", balanceScore);

    await retrieveAssignedTests(userID).then((checkbox_obj) => {
      newPatientObj = {
        patient_name: patientName,
        user_id: userID,
        assigned_test_num: res1.data.getPatientAssignedTests.length,
        last_movement_tested: lastMovementAssigned,
        last_test_score: lastScore,
        movements_assigned: checkbox_obj,
      };
    });

    console.log("Patient From DB", newPatientObj);

    return newPatientObj;
  } catch (err) {
    console.log(err);
    return {};
  }
}

async function assignToCareprovider(careProviderId, user_id) {
  let sesh = await Auth.currentSession();
  let idtoken = sesh.idToken.jwtToken;

  try {
    let response = await API.graphql({
      query: addPatientToCareProvider,
      variables: {
        care_provider_id: careProviderId,
        patient_id: user_id,
      },
      authToken: idtoken,
    });

    console.log("addPatientToCareProvider: ", response);
  } catch (err) {
    console.log(err);
  }
}

function SearchPatient(props) {
  const [inputName, setInputName] = React.useState("");
  const [inputInfo, setInputInfo] = React.useState({});
  const [addPatientDisabled, setAddPatientDisabled] = React.useState(true);
  const {
    patientDataRowsArr,
    updatePatientDataRowsArr,
    setAddPatientModalOpen,
    searchPatientModalOpen,
    setSearchPatientModalOpen,
    searchData,
    careProviderId,
  } = props;

  let currPatientNamesArr = patientDataRowsArr.map(
    (patientDataRow) => patientDataRow.patient_name
  );
  let currUserIDArr = patientDataRowsArr.map(
    (patientDataRow) => patientDataRow.user_id
  );

  console.log("In SearchPatient: ", searchData);

  const handleCloseModal = () => {
    setSearchPatientModalOpen(false);
    setAddPatientModalOpen(false);
    setAddPatientDisabled(true);
    setInputName("");
    setInputInfo({});
  };

  const handleOpenAddPatientModal = () => {
    setInputName("");
    setInputInfo({});

    setAddPatientDisabled(true);
    setAddPatientModalOpen(true);
    setSearchPatientModalOpen(false);
  };

  const handlePatientNameInput = (event, value) => {
    setInputName(value.patient_name);
    setInputInfo(value);
    setAddPatientDisabled(false);

    console.log("Current Text: " + event.target.value);
    console.log("Current Value: " + value);
  };

  const handleAddPatientClick = () => {
    handleCloseModal();
    console.log("Name: " + inputName);
    console.log(
      "Input Info: " + inputInfo.patient_name + " " + inputInfo.user_id
    );

    if (
      !(
        currPatientNamesArr.includes(inputName) &&
        currUserIDArr.includes(inputInfo.user_id)
      )
    ) {
      retrievePatientInfo(inputInfo.patient_name, inputInfo.user_id).then(
        (patientInfo) => {
          assignToCareprovider(careProviderId, inputInfo.user_id).then(() => {
            patientDataRowsArr.push(patientInfo);
            updatePatientDataRowsArr(patientDataRowsArr.slice());
            console.log("Unique Entry of: " + inputName);
          });
        }
      );
    }

    setAddPatientDisabled(true);
    setInputName("");
    setInputInfo({});
  };

  return (
    <Dialog
      open={searchPatientModalOpen}
      onClose={handleCloseModal}
      maxWidth="sm"
      fullWidth={true}
      transitionDuration={0}
    >
      <DialogTitle>Search for Patient</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ padding: "0 0 20px 0" }}>
          Search for an existing patient in the database.
        </DialogContentText>
        {/* Modify the options property when there is actual retrieved data from AWS */}
        <Autocomplete
          autoSelect
          disableClearable
          noOptionsText="No Patients Listed"
          getOptionLabel={(option) =>
            option.patient_name + " (ID: " + option.user_id + ")"
          }
          options={searchData}
          onChange={handlePatientNameInput}
          ListboxProps={{ style: { maxHeight: 200, overflow: "auto" } }}
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus
              id="patient_name"
              label="Patient Name"
              value={inputName}
              fullWidth
              variant="standard"
              InputProps={{
                ...params.InputProps,
                type: "search",
              }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleOpenAddPatientModal}>
          Manually Add New Patient
        </Button>
        <Button onClick={handleCloseModal}>Cancel</Button>
        <Button disabled={addPatientDisabled} onClick={handleAddPatientClick}>
          Add Selected Patient
        </Button>
        {/* Modify the onClick function later for Add Patient button */}
      </DialogActions>
    </Dialog>
  );
}

function ManualAddPatient(props) {
  const [inputName, setInputName] = React.useState("");
  const [addPatientDisabled, setAddPatientDisabled] = React.useState(true);
  const {
    patientDataRowsArr,
    updatePatientDataRowsArr,
    addPatientModalOpen,
    setAddPatientModalOpen,
    setSearchPatientModalOpen,
    careProviderId,
  } = props;

  async function manuallyAddPatientToDatabase(patient_name, user_id) {
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;

    try {
      let response = await API.graphql({
        query: createPatient,
        variables: {
          name: patient_name,
          patient_id: user_id,
          //manuallyCreated: true
        },
        authToken: idtoken,
      });

      console.log("createPatient: ", response);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  const handleCloseModal = () => {
    setSearchPatientModalOpen(false);
    setAddPatientModalOpen(false);
    setAddPatientDisabled(true);
  };

  const handleOpenSearchPatientModal = () => {
    setInputName("");
    setSearchPatientModalOpen(true);
    setAddPatientModalOpen(false);
    setAddPatientDisabled(true);
  };

  const handlePatientNameInput = (event) => {
    let textInput = event.target.value;
    setInputName(textInput);
    console.log("Current Text: " + textInput);

    if (textInput.trim().length > 0) {
      setAddPatientDisabled(false);
    } else {
      setAddPatientDisabled(true);
    }
  };

  // Modify the onClick function later for Add Patient button
  const handleAddPatientClick = () => {
    setAddPatientModalOpen(false);

    let newPatientObj = createPatientInfoObj(inputName);

    manuallyAddPatientToDatabase(
      newPatientObj["patient_name"],
      newPatientObj["user_id"]
    ).then((bool) => {
      if (bool) {
        assignToCareprovider(careProviderId, newPatientObj["user_id"]).then(
          () => {
            patientDataRowsArr.push(newPatientObj);
            let updatedArr = patientDataRowsArr.slice(); //make copy of array
            updatePatientDataRowsArr(updatedArr); //add to table by changing state
          }
        );
      } else {
        setAddPatientModalOpen(true);
      }
    });

    setAddPatientDisabled(true);
    setInputName("");
  };

  return (
    <Dialog
      open={addPatientModalOpen}
      onClose={handleCloseModal}
      maxWidth="sm"
      fullWidth={true}
      transitionDuration={0}
    >
      <DialogTitle>Add a Patient</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ padding: "0 0 20px 0" }}>
          Manually add a new patient.
        </DialogContentText>
        <TextField
          autoFocus
          id="new_patient_name"
          label="New Patient Name"
          value={inputName}
          onChange={handlePatientNameInput}
          fullWidth
          variant="standard"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleOpenSearchPatientModal}>
          Search for Patient
        </Button>
        <Button onClick={handleCloseModal}>Cancel</Button>
        <Button disabled={addPatientDisabled} onClick={handleAddPatientClick}>
          Add New Patient
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AddPatientFullModal({
  patientDataRowsArr,
  updatePatientDataRowsArr,
  careProviderId,
}) {
  const [searchPatientModalOpen, setSearchPatientModalOpen] =
    React.useState(false);
  const [addPatientModalOpen, setAddPatientModalOpen] = React.useState(false);
  const [searchData, setSearchData] = React.useState([]);

  // searchData = searchPopOutData;

  // const handleOpenAddPatientModal = () => {
  //     setSearchPatientModalOpen(false)
  //     setAddPatientModalOpen(true);
  // }

  async function retrieveAllPatients() {
    let response = await API.graphql({ query: getAllPatients });

    console.log("getAllPatients: ", response);
    let patientSearchRow = {};
    let allPatientsArr = response.data.getAllPatients;
    let responseData = [];

    for (let i = 0; i < allPatientsArr.length; i++) {
      patientSearchRow = {
        user_id: allPatientsArr[i]["patient_id"],
        patient_name: allPatientsArr[i]["name"],
      };
      responseData.push(patientSearchRow);
    }
    console.log("responseData ", responseData);
    return responseData;
  }

  const handleOpenSearchPatientModal = () => {
    retrieveAllPatients().then((responseData) => {
      setSearchData(responseData.slice());
    });

    setAddPatientModalOpen(false);
    setSearchPatientModalOpen(true);
  };

  return (
    <div>
      <Button onClick={handleOpenSearchPatientModal} variant="outlined">
        Add Patient
      </Button>
      <SearchPatient
        patientDataRowsArr={patientDataRowsArr}
        updatePatientDataRowsArr={updatePatientDataRowsArr}
        setAddPatientModalOpen={setAddPatientModalOpen}
        searchPatientModalOpen={searchPatientModalOpen}
        setSearchPatientModalOpen={setSearchPatientModalOpen}
        searchData={searchData}
        careProviderId={careProviderId}
      />
      <ManualAddPatient
        patientDataRowsArr={patientDataRowsArr}
        updatePatientDataRowsArr={updatePatientDataRowsArr}
        addPatientModalOpen={addPatientModalOpen}
        setAddPatientModalOpen={setAddPatientModalOpen}
        setSearchPatientModalOpen={setSearchPatientModalOpen}
        careProviderId={careProviderId}
      />
    </div>
  );
}
