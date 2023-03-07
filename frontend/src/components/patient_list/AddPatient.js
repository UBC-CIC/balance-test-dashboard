import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { v4 as uuidv4, v5 as uuidv5 } from "uuid";

const searchPopOutData = [
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
      }
]

//may need to remake format depending on how the data is retrieved

function createPatientInfoObj(patientName) {
    console.log("New Patient Name: " + patientName);

    const newUserID = uuidv5(patientName, uuidv4()); //make a uuid with a name and random uuid

    let newPatientObj = {
        user_id: newUserID,
        patient_name: patientName,
        assigned_test_num: 0,
        last_movement_tested: '-',
        last_test_score: '-'
    };
    // let newPatientObj = //retrieve data from array, or figure out how to get index of data
    
    return newPatientObj;
}

//remake this when you have retrieved data from AWS
function retrievePatientInfo(patientName, userID) {
    console.log("Added Patient from DB: " + patientName + " " + userID);
    let newPatientObj = {
        user_id: userID,
        patient_name: patientName,
        assigned_test_num: 0,
        last_movement_tested: '-',
        last_test_score: '-'
    };
    
    return newPatientObj;
}


function SearchPatient(props) {
    const [inputName, setInputName] = React.useState("");
    const [inputInfo, setInputInfo] = React.useState({});
    const [addPatientDisabled, setAddPatientDisabled] = React.useState(true);
    const { patientDataRowsArr, updatePatientDataRowsArr, setAddPatientModalOpen, searchPatientModalOpen, setSearchPatientModalOpen } = props;
    
    let currPatientNamesArr = patientDataRowsArr.map((patientDataRow) => (patientDataRow.patient_name));
    let currUserIDArr = patientDataRowsArr.map((patientDataRow) => (patientDataRow.user_id));

    const handleCloseModal = () => {
        setSearchPatientModalOpen(false)
        setAddPatientModalOpen(false);
        setAddPatientDisabled(true);
        setInputName("");
        setInputInfo({});
    }

    const handleOpenAddPatientModal = () => {
        setInputName("");
        setInputInfo({});

        setAddPatientDisabled(true);
        setAddPatientModalOpen(true);
        setSearchPatientModalOpen(false);
    }

    const handlePatientNameInput = (event, value) => {
        setInputName(value.patient_name);
        setInputInfo(value);
        setAddPatientDisabled(false);

        console.log("Current Text: " + event.target.value)
        console.log("Current Value: " + value)
    }

    const handleAddPatientClick = () => {
        handleCloseModal();
        console.log("Name: " + inputName);
        console.log("Input Info: " + inputInfo.patient_name + " " + inputInfo.user_id)

        if (!(currPatientNamesArr.includes(inputName) && currUserIDArr.includes(inputInfo.user_id))) {
            let retrievedPatientInfo = retrievePatientInfo(inputInfo.patient_name, inputInfo.user_id)
            patientDataRowsArr.push(retrievedPatientInfo);

            let updatedArr = patientDataRowsArr.slice(); //make copy of array
            updatePatientDataRowsArr(updatedArr); //add to table by changing state

            console.log("Unique Entry of: " + inputName);
        }
        
        setAddPatientDisabled(true);
        setInputName("");
        setInputInfo({});
    }

    return (
            
        <Dialog open={searchPatientModalOpen} onClose={handleCloseModal} maxWidth='sm' fullWidth={true} transitionDuration={0}> 
    
            <DialogTitle>Search for Patient</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{padding: '0 0 20px 0'}}>
                    Search for an existing patient in the database.
                </DialogContentText>
                    {/* Modify the options property when there is actual retrieved data from AWS */}
                    <Autocomplete
                        autoSelect
                        disableClearable
                        noOptionsText='No Patients Listed'
                        getOptionLabel={(option) => (option.patient_name + " (ID: " + option.user_id + ")")}
                        options={searchPopOutData}
                        onChange={handlePatientNameInput}
                        ListboxProps={{style: {maxHeight: 200, overflow: 'auto' }}}
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
                                    type: 'search'
                                }}
                            />
                        )}
                    />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleOpenAddPatientModal}>Manually Add New Patient</Button>
                <Button onClick={handleCloseModal}>Cancel</Button>
                <Button disabled={addPatientDisabled} onClick={handleAddPatientClick}>Add Selected Patient</Button> 
                {/* Modify the onClick function later for Add Patient button */}
            </DialogActions>
        </Dialog>
    );
}

function ManualAddPatient(props) {
    const [inputName, setInputName] = React.useState("");
    const [addPatientDisabled, setAddPatientDisabled] = React.useState(true);
    const { patientDataRowsArr, updatePatientDataRowsArr, addPatientModalOpen, setAddPatientModalOpen, setSearchPatientModalOpen } = props;

    const handleCloseModal = () => {
        setSearchPatientModalOpen(false)
        setAddPatientModalOpen(false);
        setAddPatientDisabled(true);
    }

    const handleOpenSearchPatientModal = () => {
        setInputName("");
        setSearchPatientModalOpen(true); 
        setAddPatientModalOpen(false);
        setAddPatientDisabled(true);
    }

    const handlePatientNameInput = (event) => {
        let textInput = event.target.value
        setInputName(textInput);
        console.log("Current Text: " + textInput)

        if (textInput.trim().length > 0) {
            setAddPatientDisabled(false);
        
        } else {
            setAddPatientDisabled(true);
        }
    }

    // Modify the onClick function later for Add Patient button
    const handleAddPatientClick = () => {
        setAddPatientModalOpen(false);
        console.log("Input: " + inputName);

        let newPatientObj = createPatientInfoObj(inputName);
        
        patientDataRowsArr.push(newPatientObj);
        let updatedArr = patientDataRowsArr.slice(); //make copy of array
        updatePatientDataRowsArr(updatedArr); //add to table by changing state
        
        console.log("New Patient Info: " + newPatientObj);

        setAddPatientDisabled(true);
        setInputName("");
    }

    return (
            
        <Dialog open={addPatientModalOpen} onClose={handleCloseModal} maxWidth='sm' fullWidth={true} transitionDuration={0}> 
        
            <DialogTitle>Add a Patient</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{padding: '0 0 20px 0'}}>
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
                <Button onClick={handleOpenSearchPatientModal}>Search for Patient</Button>
                <Button onClick={handleCloseModal}>Cancel</Button>
                <Button disabled={addPatientDisabled} onClick={handleAddPatientClick}>Add New Patient</Button> 
            </DialogActions>
        </Dialog>
        
    );
}

export default function AddPatientFullModal({ patientDataRowsArr, updatePatientDataRowsArr }) {
    const [searchPatientModalOpen, setSearchPatientModalOpen] = React.useState(false);
    const [addPatientModalOpen, setAddPatientModalOpen] = React.useState(false);

    // const handleOpenAddPatientModal = () => {
    //     setSearchPatientModalOpen(false)
    //     setAddPatientModalOpen(true);
    // }

    const handleOpenSearchPatientModal = () => {
        setAddPatientModalOpen(false);
        setSearchPatientModalOpen(true); 
    }

    return (
        <div>
            <Button onClick={handleOpenSearchPatientModal} variant='outlined'>Add Patient</Button>
            <SearchPatient 
                patientDataRowsArr={patientDataRowsArr} 
                updatePatientDataRowsArr={updatePatientDataRowsArr} 
                setAddPatientModalOpen={setAddPatientModalOpen}
                searchPatientModalOpen={searchPatientModalOpen}
                setSearchPatientModalOpen={setSearchPatientModalOpen}
            />
            <ManualAddPatient 
                patientDataRowsArr={patientDataRowsArr} 
                updatePatientDataRowsArr={updatePatientDataRowsArr} 
                addPatientModalOpen={addPatientModalOpen} 
                setAddPatientModalOpen={setAddPatientModalOpen}
                setSearchPatientModalOpen={setSearchPatientModalOpen}
            />
        </div>
    );
}
