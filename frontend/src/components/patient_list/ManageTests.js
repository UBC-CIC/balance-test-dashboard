import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import "./ManageTests.css";

const movement_tests = ["Sit-to-Stand", "Movement 2", "Movement 3"]; // modify the movement names if needed

export default function ManageTests({ rowNum, user_id, patientDataRowsArr, updatePatientDataRowsArr }) {
    const [modalOpen, setModalOpen] = React.useState(false);

    const checkboxInitStateObj = {}
    for (let i in movement_tests) {
        checkboxInitStateObj[movement_tests[i]] = false;
    }

    const [checkboxStates, setCheckboxStates] = React.useState(checkboxInitStateObj);
    const [prevCheckboxStates, setPrevCheckboxStates] = React.useState(checkboxInitStateObj);

    const handleOpenModal = () => {
        // setCheckboxStates(checkboxInitStateObj);
        setModalOpen(true);
    }

    const handleCloseModal = () => {
        setCheckboxStates(prevCheckboxStates);
        setModalOpen(false);
    }

    const handleCheckbox = (event) => {
        setCheckboxStates({
            ...checkboxStates,
            [event.target.name]: event.target.checked
        });

        console.log("Checked: " + event.target.checked);
        console.log("Checkbox Label: " + event.target.name);
    }

    const handleSaveTests = () => {
        let countTrues = Object.values(checkboxStates).filter(Boolean).length;

        //need to specify what tests should be sent to the patient here and save the tests accordingly
        console.log("Checkbox States: " + checkboxStates)

        //send dict obj to database to show which tests are true/false
        patientDataRowsArr[rowNum].assigned_test_num = countTrues;
        let updatedArr = patientDataRowsArr.slice();
        updatePatientDataRowsArr(updatedArr);
        
        console.log(checkboxStates);
        setModalOpen(false);
        setPrevCheckboxStates(checkboxStates);
    }

    return (
        <div className='manage-button-div'>
            <Button onClick={handleOpenModal}>Manage</Button>
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth='sm' scroll='paper'>
                <DialogTitle>Assign Tests</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{padding: '0 0 20px 0'}}>
                        Select the movement(s) to assign to the patient.
                    </DialogContentText>
                    {movement_tests.map((movement_test) => {
                        console.log("Checked: " + movement_test + " " + checkboxStates[movement_test])
                        return(
                            <FormGroup key={movement_test}>
                                <FormControlLabel 
                                    control={<Checkbox checked={checkboxStates[movement_test]} name={movement_test} />} 
                                    label={movement_test} 
                                    onChange={handleCheckbox} />
                            </FormGroup>
                        )
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