import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

//may need to remake format depending on how the data is retrieved
let searchPopOutData = [
    {patient_id: 29235305, patient_name: 'Amanda Spence'},
    {patient_id: 23897593, patient_name: 'Jane Doe'},
    {patient_id: 19285239, patient_name: 'John Doe'},
    {patient_id: 90258044, patient_name: 'Robbie Mac'},
    
]

function createPatientInfoObj(patientName) {
    console.log("New Patient Name: " + patientName);
    let newPatientObj = {
        patient_id: 12345678,
        patient_name: patientName,
        assigned_test_num: 0,
        last_movement_tested: '-',
        last_test_score: '-'
    };
    
    return newPatientObj;
}

//next step: make search bar pop up placeholder names, select placeholder name and add its info into the table
function SearchPatient(props) {
    const [inputName, setInputName] = React.useState("");
    const { itemsArr, updateTableState, setAddPatientModalOpen, searchPatientModalOpen, setSearchPatientModalOpen } = props;
    
    const handleCloseModal = () => {
        setSearchPatientModalOpen(false)
        setAddPatientModalOpen(false);
    }

    const handleOpenAddPatientModal = () => {
        setInputName("");

        setAddPatientModalOpen(true);
        setSearchPatientModalOpen(false);
    }

    const handlePatientNameInput = (event, value) => {
        let textInput = value
        setInputName(value);
        console.log("Current Text: " + event.target.value)
        console.log("Current Value: " + value)
    }

    const handleAddPatientClick = () => {
        handleCloseModal();
        console.log("Input: " + inputName);


        setInputName("");
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
                        options={searchPopOutData.map((item) => (item.patient_name + " (ID: " + item.patient_id + ")"))}
                        onChange={handlePatientNameInput}
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
                        renderOptions={(props, option, state) => {}}
                    />
                    {/* <Autocomplete
                        autoSelect
                        disableClearable
                        noOptionsText='No Patients Listed'
                        options={searchPopOutData.map((item) => (item.patient_name + " (ID: " + item.patient_id + ")"))}
                        onChange={handlePatientNameInput}
                        onInputChange={handlePatientNameInput}
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
                        renderOptions={(props, option, state) => {}}
                    /> */}

            </DialogContent>
            <DialogActions>
                <Button onClick={handleOpenAddPatientModal}>Manually Add New Patient</Button>
                <Button onClick={handleCloseModal}>Cancel</Button>
                <Button onClick={handleAddPatientClick}>Add Selected Patient</Button> 
                {/* Modify the onClick function later for Add Patient button */}
            </DialogActions>
        </Dialog>
    );
}

function ManualAddPatient(props) {
    const [inputName, setInputName] = React.useState("");
    const { itemsArr, updateTableState, addPatientModalOpen, setAddPatientModalOpen, setSearchPatientModalOpen } = props;

    const handleCloseModal = () => {
        setSearchPatientModalOpen(false)
        setAddPatientModalOpen(false);
    }

    const handleOpenSearchPatientModal = () => {
        setInputName("");
        setSearchPatientModalOpen(true); 
        setAddPatientModalOpen(false);
    }

    const handlePatientNameInput = (event) => {
        let textInput = event.target.value
        setInputName(textInput);
        console.log("Current Text: " + textInput)
    }

    // Modify the onClick function later for Add Patient button
    const handleAddPatientClick = () => {
        setAddPatientModalOpen(false);
        console.log("Input: " + inputName);

        let newPatientObj = createPatientInfoObj(inputName);
        
        itemsArr.push(newPatientObj);
        let updatedArr = itemsArr.slice();
        updateTableState(updatedArr); 
        
        console.log("New Patient Info: " + newPatientObj);

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
                <Button onClick={handleAddPatientClick}>Add New Patient</Button> 
            </DialogActions>
        </Dialog>
        
    );
}

export default function AddPatientFullModal({ itemsArr, updateTableState }) {
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
            <Button onClick={handleOpenSearchPatientModal}>Add Patient</Button>
            <SearchPatient 
                itemsArr={itemsArr} 
                updateTableState={updateTableState} 
                setAddPatientModalOpen={setAddPatientModalOpen}
                searchPatientModalOpen={searchPatientModalOpen}
                setSearchPatientModalOpen={setSearchPatientModalOpen}
            />
            <ManualAddPatient 
                itemsArr={itemsArr} 
                updateTableState={updateTableState} 
                addPatientModalOpen={addPatientModalOpen} 
                setAddPatientModalOpen={setAddPatientModalOpen}
                setSearchPatientModalOpen={setSearchPatientModalOpen}
            />
        </div>
    );
}

// export default function AddPatient({  itemsArr, updateTableState }) {
//     const [modalOpen, setModalOpen] = React.useState(false);
//     const [inputName, setInputName] = React.useState("");

//     const { itemsArr, updateTableState, setAddPatientModalOpen, setSearchPatientModalOpen } = props;

//     const handleOpenModal = () => {
//         setModalOpen(true);
//     };

//     const handleCloseModal = () => {
//         setModalOpen(false);
//     };

//     const handlePatientNameInput = (event) => {
//         let textInput = event.target.value
//         setInputName(textInput);
//         console.log("Current Text: " + textInput)
//     };

//     const handleAddPatientClick = () => {
//         setModalOpen(false);
//         console.log("Input: " + inputName);

//         let newPatientObj = createPatientInfoObj(inputName);
        
//         itemsArr.push(newPatientObj);
//         let updatedArr = itemsArr.slice();
//         updateTableState(updatedArr); 
        
//         console.log("New Patient Info: " + newPatientObj);

//         setInputName("");
//     };

//     return (
//         <div>
//             <Button onClick={handleOpenModal}>Add Patient</Button>
//             <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth='sm' fullWidth={true}> 
            
//                 <DialogTitle>Add a Patient</DialogTitle>
//                 <DialogContent>
//                     <DialogContentText sx={{padding: '0 0 20px 0'}}>
//                         Manually add a new patient.
//                     </DialogContentText>
//                     <TextField 
//                         autoFocus
//                         id="new_patient_name"
//                         label="New Patient Name"
//                         value={inputName}
//                         onChange={handlePatientNameInput}
//                         fullWidth
//                         variant="standard"
//                     />
                    
//                 </DialogContent>
//                 <DialogActions>
//                     <Button>Search for Patient</Button>
//                     <Button onClick={handleCloseModal}>Cancel</Button>
//                     <Button onClick={handleAddPatientClick}>Add New Patient</Button> 
//                     {/* Modify the onClick function later for Add Patient button */}
//                 </DialogActions>
//             </Dialog>
//         </div>
//     );
// }