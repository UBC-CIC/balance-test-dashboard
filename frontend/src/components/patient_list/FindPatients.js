import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import IconButton from "@mui/material/IconButton";
import TextField from '@mui/material/TextField';

import { Amplify, API, graphqlOperation } from "aws-amplify";
import awsconfig from "../../aws-exports";
import { getAllPatients, getTestEvents } from "../../graphql/queries";
Amplify.configure(awsconfig);

export default function SearchForPatients(props) {
    const [inputName, setInputName] = React.useState("");
    const [searchButtonDisabled, setSearchButtonDisabled] = React.useState(true);
    const [searchSubmitKey, setSearchSubmitKey] = React.useState(0); //for resetting after submitting

    const { patientDataRowsArr, updatePatientDataRowsArr, searchResults, setSearchResults, setTablePage } = props;

    let patientNamesArr = patientDataRowsArr.map((patientDataRow) => (patientDataRow.patient_name.trim()))
    const uniquePatientNamesArr = [...new Set(patientNamesArr)].sort();

    const handlePatientNameInput = (event, value) => {
        //change this
        if (value != null) {
            setInputName(value);

        } else {
            setInputName("");
        }
        
        console.log("Current Text: " + event.target.value)
        console.log("Current Value: " + value)
    }

    const handleSearchClick = () => {
        console.log("Searching Name: " + inputName);
        let resultsRowArr = patientDataRowsArr.filter((patientDataRow) => (patientDataRow.patient_name.trim().toLowerCase() == inputName.trim().toLowerCase()));
        setSearchResults(resultsRowArr.slice());
        setTablePage(0);
        setSearchSubmitKey(searchSubmitKey + 1);

        console.log(resultsRowArr);
        console.log(searchResults.length);
        setInputName("");
    }

    const handleShowAllClick = () => {
        setInputName("");
        setSearchResults([]);
        setSearchSubmitKey(0);
    }
 
    return (
        <Box sx={{display: 'flex', flexDirection: 'row', width: '100%', overflow: 'auto', margin: '2.5% 0% 0.5% 0%'}}>
            <Autocomplete
                autoSelect
                clearIcon={""}
                noOptionsText='No Patients in the Table'
                groupBy={(option) => (option.trim().toUpperCase()[0])}
                options={uniquePatientNamesArr}
                onChange={handlePatientNameInput}
                ListboxProps={{style: {maxHeight: 400, overflow: 'auto' }}}
                renderInput={(params) => (
                    <TextField 
                        {...params}
                        autoFocus={false}
                        id="search_patient_name"
                        label="Search for Patient Name"
                        value={inputName}
                        fullWidth
                        variant="standard"
                        InputProps={{
                            ...params.InputProps,
                            type: 'search'
                        }}
                        
                    />
                )}
                sx={{width: '50%'}}
                key={searchSubmitKey}
            />
            <Button onClick={handleSearchClick} sx={{margin: 1, width: '20%'}}>Search</Button>
            <Button onClick={handleShowAllClick} sx={{margin: 1, width: '20%'}}>Show All Patients</Button>
        </Box>
    );
}