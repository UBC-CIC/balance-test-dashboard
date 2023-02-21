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

import "./ManageTests.css"

const movement_tests = ["Sit-to-Stand", "Movement 2", "Movement 3"]

// next step: select movements and assign them to a patient, change "# Tests Assigned" value, 
export default function ManageTests({ patient_id }) {
    const [modalOpen, setModalOpen] = React.useState(false);

    const handleOpenModal = () => {
        setModalOpen(true);
    }

    const handleCloseModal = () => {
        setModalOpen(false);
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
                        return(
                            <FormGroup key={movement_test}>
                                <FormControlLabel control={<Checkbox />} label={movement_test} />
                            </FormGroup>
                        )
                    })}
                    
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Cancel</Button>
                    <Button onClick={handleCloseModal}>Send to Patient</Button> 
                    {/* Modify the onClick function later for Send to Patient button */}
                </DialogActions>
            </Dialog>
        </div>
    );
}