import React from "react";
import { useNavigate } from 'react-router-dom';
import { ReactDOM } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';

import "./PatientsTable.css";
import AddPatientFullModal from "./AddPatient";
import ManageTests from "./ManageTests";

const headerColumns = [
    {id: 'patient_name', className: "header-column-text", label: 'Patient Name'},
    {id: 'patient_id', className: "header-column-text", label: 'Patient ID'},
    {id: 'assigned_test_num', className: "header-column-text", label: 'Movement Tests'},
    {id: 'last_movement_tested', className: "header-column-text", label: 'Last Movement Tested'},
    {id: 'last_test_score', className: "header-column-text", label: 'Last Test Score (%)'},
    {id: 'see_patient_data', className: "header-column-text", label: 'Patient Data'}
];

//change the patient_id values to string type
const testRows = [
    {
        patient_id: 19285239, 
        patient_name: 'John Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 65
    },
    {
        patient_id: 23897593, 
        patient_name: 'Jane Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 45
    },
    {
        patient_id: 90258044, 
        patient_name: 'Robbie Mac', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 56
    },
    {
        patient_id: 29235305, 
        patient_name: 'Amanda Spence', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 23
    },
    {
        patient_id: 19285239, 
        patient_name: 'John Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 65
    },
    {
        patient_id: 23897593, 
        patient_name: 'Jane Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 45
    },
    {
        patient_id: 90258044, 
        patient_name: 'Robbie Mac', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 56
    },
    {
        patient_id: 29235305, 
        patient_name: 'Amanda Spence', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: '23'
    }, 
    {
        patient_id: 19285239, 
        patient_name: 'John Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 65
    },
    {
        patient_id: 23897593, 
        patient_name: 'Jane Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 45
    },
    {
        patient_id: 90258044, 
        patient_name: 'Robbie Mac', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 56
    },
    {
        patient_id: 29235305, 
        patient_name: 'Amanda Spence', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 23
    },
    {
        patient_id: 19285239, 
        patient_name: 'John Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 65
    },
    {
        patient_id: 23897593, 
        patient_name: 'Jane Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 45
    },
    {
        patient_id: 90258044, 
        patient_name: 'Robbie Mac', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 56
    },
    {
        patient_id: 19285239, 
        patient_name: 'John Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 65
    },
    {
        patient_id: 23897593, 
        patient_name: 'Jane Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 45
    },
    {
        patient_id: 90258044, 
        patient_name: 'Robbie Mac', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 56
    },
    {
        patient_id: 29235305, 
        patient_name: 'Amanda Spence', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 23
    },
    {
        patient_id: 19285239, 
        patient_name: 'John Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 65
    },
    {
        patient_id: 23897593, 
        patient_name: 'Jane Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 45
    },
    {
        patient_id: 90258044, 
        patient_name: 'Robbie Mac', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 56
    },
    {
        patient_id: 29235305, 
        patient_name: 'Amanda Spence', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 23
    }, 
    {
        patient_id: 19285239, 
        patient_name: 'John Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 65
    },
    {
        patient_id: 23897593, 
        patient_name: 'Jane Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 45
    },
    {
        patient_id: 90258044, 
        patient_name: 'Robbie Mac', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 56
    },
    {
        patient_id: 29235305, 
        patient_name: 'Amanda Spence', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 23
    },
    {
        patient_id: 19285239, 
        patient_name: 'John Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 65
    },
    {
        patient_id: 23897593, 
        patient_name: 'Jane Doe', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 45
    },
    {
        patient_id: 90258044, 
        patient_name: 'Robbie Mac', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 56
    },
    {
        patient_id: 29235305, 
        patient_name: 'Amanda Spence', 
        assigned_test_num: 1,
        last_movement_tested: 'Sit-to-Stand',
        last_test_score: 23
    }
];

function FixedHeaderRow() {
    return (
        <TableRow>
            {headerColumns.map((headerColumn) => (
                <TableCell
                    variant='head'
                    key={headerColumn.id}
                    className={headerColumn.className}
                    sx={{fontWeight: 'bold'}}
                >
                    {headerColumn.label}
                </TableCell>
            ))}
        </TableRow>
    );
}

function DisplayRows({tablePage, rowsPerTablePage, items}) {

    //need to figure out which hooks are needed to make and use
    const [numTestsAssigned, setNumTestsAssigned] = React.useState(0);
    // const [lastMovementTested, setLastMovementTested] = React.useState("-");
    // const [lastTestScore, setLastTestScore] = React.useState("-");

    // const navigate = useNavigate();


    if (items.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={headerColumns.length} sx={{textAlign: 'center'}}>
                    No Patients Found - Add a Patient.
                </TableCell>
            </TableRow>
        );

    } else {
        return (
            items.slice(tablePage * rowsPerTablePage, tablePage * rowsPerTablePage + rowsPerTablePage)
            .map((row) => {

                return (
                    <TableRow>
                        {headerColumns.map((column) => {

                            if (column.id === "see_patient_data") {
                                return (
                                    <TableCell
                                        variant='body'
                                        key={column.id}
                                        align='left'
                                        sx={{whiteSpace: 'nowrap'}}
                                    >
                                        {column.id === "see_patient_data" && <Button onClick={() => console.log("navigate(/patient)")}>See Patient Data</Button>} 
                                    </TableCell>
                                );
                            } else {
                                const obj_value =  row[column.id];

                                if (column.id === "last_test_score") {
                                    return(
                                        <TableCell
                                            variant='body'
                                            key={column.id}
                                            align='left'
                                            sx={() => {
                                                if (obj_value >= 50) {
                                                    return {color: 'green', height: '20px', whiteSpace: 'nowrap'}
                                                
                                                } else if (obj_value >= 0) {
                                                    return {color: 'red', height: '20px', whiteSpace: 'nowrap'}
                                                
                                                } else {
                                                    return {color: 'black', height: '20px', whiteSpace: 'nowrap'}
                                                }
                                            }}
                                        >
                                            {obj_value}
                                        </TableCell>
                                    );
                                
                                } else {
                                    return (
                                        <TableCell
                                            variant='body'
                                            key={column.id}
                                            align='left'
                                            sx={{height: '20px', whiteSpace: 'nowrap'}}
                                        >
                                            {column.label === "Movement Tests" ? obj_value + " Tests Assigned " : obj_value}
                                            {column.label === "Movement Tests" && <ManageTests />} 
                                        </TableCell>
                                    );
                                }

                                
                            }
                        })}
                    </TableRow>
                );
            })
        );
    }
}

export function PatientsTable({ care_provider_id }) {
    const [items, updateItems] = React.useState([]);

    const [tablePage, setTablePage] = React.useState(0);
    const [rowsPerTablePage, setRowsPerTablePage] = React.useState(10);

    React.useEffect(() => {
        updateItems(testRows); 
    }, [items]);


    const handleChangePage = (event, newTablePage) => {
        setTablePage(newTablePage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerTablePage(+event.target.value);
        setTablePage(0);
    };

    return (
        <Box sx={{display: 'flex', width: '100%', overflow: 'hidden', flexDirection: 'column'}}>
            <div className="above-table-row">
                <AddPatientFullModal itemsArr={items} updateTableState={updateItems} />
            </div>

            <Box sx={{color: '#000000', width: '100%'}}> 
                <TableContainer sx={{maxWidth: '95%', margin: '0 2.5% 0 2.5%', border: 1, minHeight: 100, maxHeight: 500, overflow: 'auto'}}>
                    
                    <Table stickyHeader>
                        <TableHead>
                            { FixedHeaderRow() }
                        </TableHead>

                        <TableBody>
                            { DisplayRows({tablePage, rowsPerTablePage, items}) }
                        </TableBody>
                    </Table>
                
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={items.length} //change this later
                        rowsPerPage={rowsPerTablePage}
                        page={tablePage}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        sx={{borderTop: 1, borderColor: '#000000', position: 'sticky'}}
                    />
                </TableContainer>

                
            </Box>
        </Box>
    );
}
