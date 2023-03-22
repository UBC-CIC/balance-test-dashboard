import React, { useEffect, useState } from "react";
// import { useNavigate } from 'react-router-dom';
import { ReactDOM } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";

import "./PatientsTable.css";
import AddPatientFullModal from "./AddPatient";
import { ManageTests, retrieveAssignedTests } from "./ManageTests";
import { useNavigate } from "react-router";
import SearchForPatients from "./FindPatients";
import Navbar from "../nav/Navbar";

import { v4 as uuidv4 } from "uuid";

import { Amplify, API, graphqlOperation } from "aws-amplify";
import awsconfig from "../../aws-exports";

import {
  getAllPatients,
  getPatientsForCareprovider,
  getTestEvents,
  getPatientAssignedTests,
} from "../../graphql/queries";
Amplify.configure(awsconfig);

const headerColumns = [
  {
    id: "patient_name",
    className: "header-column-text",
    label: "Patient Name",
  },
  {
    id: "user_id",
    className: "header-column-text",
    label: "User ID",
  },
  {
    id: "assigned_test_num",
    className: "header-column-text",
    label: "Movement Tests",
  },
  {
    id: "last_movement_tested",
    className: "header-column-text",
    label: "Last Movement Tested",
  },
  {
    id: "last_test_score",
    className: "header-column-text",
    label: "Last Test Score (%)",
  },
  {
    id: "see_patient_data",
    className: "header-column-text",
    label: "Patient Data",
  },
];

//change the patient_id values to string type
const testRows = [
  {
    user_id: uuidv4(),
    patient_name: "John Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 65,
  },
  {
    user_id: uuidv4(),
    patient_name: "Jane Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 45,
  },
  {
    user_id: uuidv4(),
    patient_name: "Robbie Mac",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 56,
  },
  {
    user_id: uuidv4(),
    patient_name: "Amanda Spence",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 23,
  },
  {
    user_id: uuidv4(),
    patient_name: "John Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 65,
  },
  {
    user_id: uuidv4(),
    patient_name: "Jane Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 45,
  },
  {
    user_id: uuidv4(),
    patient_name: "Robbie Mac",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 56,
  },
  {
    user_id: uuidv4(),
    patient_name: "Amanda Spence",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 23,
  },
  {
    user_id: uuidv4(),
    patient_name: "John Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 65,
  },
  {
    user_id: uuidv4(),
    patient_name: "Jane Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 45,
  },
  {
    user_id: uuidv4(),
    patient_name: "Robbie Mac",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 56,
  },
  {
    user_id: uuidv4(),
    patient_name: "Amanda Spence",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 23,
  },
  {
    user_id: uuidv4(),
    patient_name: "John Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 65,
  },
  {
    user_id: uuidv4(),
    patient_name: "Jane Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 45,
  },
  {
    user_id: uuidv4(),
    patient_name: "Robbie Mac",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 56,
  },
  {
    user_id: uuidv4(),
    patient_name: "Amanda Spence",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 23,
  },
  {
    user_id: uuidv4(),
    patient_name: "John Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 65,
  },
  {
    user_id: uuidv4(),
    patient_name: "Jane Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 45,
  },
  {
    user_id: uuidv4(),
    patient_name: "Robbie Mac",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 56,
  },
  {
    user_id: uuidv4(),
    patient_name: "Amanda Spence",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 23,
  },
  {
    user_id: uuidv4(),
    patient_name: "John Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 65,
  },
  {
    user_id: uuidv4(),
    patient_name: "Jane Doe",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 45,
  },
  {
    user_id: uuidv4(),
    patient_name: "Robbie Mac",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 56,
  },
  {
    user_id: uuidv4(),
    patient_name: "Amanda Spence",
    assigned_test_num: 1,
    last_movement_tested: "Sit-to-Stand",
    last_test_score: 23,
  },
];

function FixedHeaderRow() {
  return (
    <TableRow>
      {headerColumns.map((headerColumn) => (
        <TableCell
          variant="head"
          key={headerColumn.id}
          className={headerColumn.className}
          sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
        >
          {headerColumn.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

function DisplayRows({
  tablePage,
  rowsPerTablePage,
  patientDataRowsArr,
  updatePatientDataRowsArr,
  loading,
}) {
  //need to figure out which hooks are needed to make and use
  const [numTestsAssigned, setNumTestsAssigned] = React.useState(0);
  // const [lastMovementTested, setLastMovementTested] = React.useState("-");
  // const [lastTestScore, setLastTestScore] = React.useState("-");

  let navigate = useNavigate();

  console.log("Display All Patients.");

  if (patientDataRowsArr.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={headerColumns.length} sx={{ textAlign: "center" }}>
          {!loading
            ? "No Patients Found - Add a Patient."
            : "Loading Patients..."}
        </TableCell>
      </TableRow>
    );
  } else {
    return patientDataRowsArr
      .slice(
        tablePage * rowsPerTablePage,
        tablePage * rowsPerTablePage + rowsPerTablePage
      )
      .map((row) => {
        return (
          <TableRow>
            {headerColumns.map((column) => {
              const obj_value = row[column.id];

              if (column.id === "see_patient_data") {
                return (
                  <TableCell
                    variant="body"
                    key={column.id}
                    align="left"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {column.id === "see_patient_data" && (
                      <Button
                        onClick={() => {
                          // navigate("/patient");
                          // console.log("row", row);
                          navigate(`/patient:${row.user_id}`);
                        }}
                      >
                        See Patient Data
                      </Button>
                    )}
                  </TableCell>
                );
              } else if (column.id === "patient_name") {
                let manualCreateBool = false; //change when the database stuff has this boolean
                if (manualCreateBool == true) {
                  return (
                    <TableCell
                      variant="body"
                      key={column.id}
                      align="left"
                      sx={{
                        height: "20px",
                        whiteSpace: "nowrap",
                        color: "#1976d2",
                      }}
                    >
                      {obj_value}
                    </TableCell>
                  );
                } else {
                  return (
                    <TableCell
                      variant="body"
                      key={column.id}
                      align="left"
                      sx={{
                        height: "20px",
                        whiteSpace: "nowrap",
                        color: "black",
                      }}
                    >
                      {obj_value}
                    </TableCell>
                  );
                }
              } else if (column.id === "last_test_score") {
                return (
                  <TableCell
                    variant="body"
                    key={column.id}
                    align="left"
                    sx={() => {
                      if (obj_value >= 50) {
                        return {
                          color: "green",
                          height: "20px",
                          whiteSpace: "nowrap",
                        };
                      } else if (obj_value >= 0) {
                        return {
                          color: "red",
                          height: "20px",
                          whiteSpace: "nowrap",
                        };
                      } else {
                        return {
                          color: "black",
                          height: "20px",
                          whiteSpace: "nowrap",
                        };
                      }
                    }}
                  >
                    {obj_value}
                  </TableCell>
                );
              } else {
                return (
                  <TableCell
                    variant="body"
                    key={column.id}
                    align="left"
                    sx={{ height: "20px", whiteSpace: "nowrap" }}
                  >
                    {column.label === "Movement Tests"
                      ? obj_value + " Tests Assigned "
                      : obj_value}
                    {column.label === "Movement Tests" && (
                      <ManageTests
                        rowNum={patientDataRowsArr.indexOf(row)}
                        user_id={row.user_id}
                        patientDataRowsArr={patientDataRowsArr}
                        updatePatientDataRowsArr={updatePatientDataRowsArr}
                      />
                    )}
                  </TableCell>
                );
              }
            })}
          </TableRow>
        );
      });
  }
}

function DisplaySearchResults({
  tablePage,
  rowsPerTablePage,
  searchResults,
  setSearchResults,
  patientDataRowsArr,
  updatePatientDataRowsArr,
}) {
  const [numTestsAssigned, setNumTestsAssigned] = React.useState(0);

  let navigate = useNavigate();
  console.log("Display Search Results.");

  if (searchResults.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={headerColumns.length} sx={{ textAlign: "center" }}>
          No Patients Found - Please Search Another Patient Name.
        </TableCell>
      </TableRow>
    );
  } else {
    return searchResults
      .slice(
        tablePage * rowsPerTablePage,
        tablePage * rowsPerTablePage + rowsPerTablePage
      )
      .map((row) => {
        return (
          <TableRow>
            {headerColumns.map((column) => {
              if (column.id === "see_patient_data") {
                return (
                  <TableCell
                    variant="body"
                    key={column.id}
                    align="left"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {column.id === "see_patient_data" && (
                      <Button
                        onClick={() => {
                          // console.log("row.patient_id", row.patient_id);
                          // navigate(`/patient:${row.patient_id}`);
                          navigate(`/patient`);
                        }}
                      >
                        See Patient Data
                      </Button>
                    )}
                  </TableCell>
                );
              } else {
                const obj_value = row[column.id];

                if (column.id === "last_test_score") {
                  return (
                    <TableCell
                      variant="body"
                      key={column.id}
                      align="left"
                      sx={() => {
                        if (obj_value >= 50) {
                          return {
                            color: "green",
                            height: "20px",
                            whiteSpace: "nowrap",
                          };
                        } else if (obj_value >= 0) {
                          return {
                            color: "red",
                            height: "20px",
                            whiteSpace: "nowrap",
                          };
                        } else {
                          return {
                            color: "black",
                            height: "20px",
                            whiteSpace: "nowrap",
                          };
                        }
                      }}
                    >
                      {obj_value}
                    </TableCell>
                  );
                } else {
                  return (
                    <TableCell
                      variant="body"
                      key={column.id}
                      align="left"
                      sx={{ height: "20px", whiteSpace: "nowrap" }}
                    >
                      {column.label === "Movement Tests"
                        ? obj_value + " Tests Assigned "
                        : obj_value}
                      {column.label === "Movement Tests" && (
                        <ManageTests
                          rowNum={patientDataRowsArr.indexOf(row)}
                          user_id={row.user_id}
                          patientDataRowsArr={patientDataRowsArr}
                          updatePatientDataRowsArr={updatePatientDataRowsArr}
                        />
                      )}
                    </TableCell>
                  );
                }
              }
            })}
          </TableRow>
        );
      });
  }
}

export function PatientsTable({ careProviderId }) {
  let data = [];
  // let data = testRows;
  careProviderId = 1;

  const [patientDataRowsArr, updatePatientDataRowsArr] = React.useState(data);

  const [tablePage, setTablePage] = React.useState(0);
  const [rowsPerTablePage, setRowsPerTablePage] = React.useState(10);
  const [loading, setLoading] = useState(true);

  const [searchResults, setSearchResults] = React.useState([]);

  const handleChangePage = (event, newTablePage) => {
    setTablePage(newTablePage);
  };

  async function fetchData() {
    let data = [];
    console.log("in fetchdata");
    try {
      console.log("in fetchdata try block");
      let response = await API.graphql(
        graphqlOperation(getPatientsForCareprovider, {
          care_provider_id: careProviderId,
        })
      );

      let patientsInfo = response.data.getPatientsForCareprovider;
      console.log("patientsInfo", patientsInfo);

      // for (let p = 0; p < patientsInfo.length; p++) {

      //   let res1 = await API.graphql(
      //     graphqlOperation(getPatientAssignedTests, {
      //       patient_id: patientsInfo[p].patient_id
      //     })
      //   );
      //   console.log("res1", res1);

      //   let res2 = await API.graphql(
      //     graphqlOperation(getTestEvents, {
      //       patient_id: patientsInfo[p].patient_id,
      //       sort: "desc",
      //       count: 1
      //     })
      //   ).catch((res) => {
      //     if (res == null) {
      //       return 0;
      //     }
      //   });
      //   console.log("res2", res2);

      //   let lastMovementAssigned = res2 == null ? '-' : (res2.data.getTestEvents.length == 0 ? '-' : (res2.data.getTestEvents[0].test_type == null ? '-' : res2.data.getTestEvents[0].test_type));
      //   let lastScore = res2 == null ? '-' : (res2.data.getTestEvents.length == 0 ? '-' : (res2.data.getTestEvents[0].balance_score == null ? '-' : res2.data.getTestEvents[0].balance_score));

      //   await retrieveAssignedTests(patientsInfo[p].patient_id).then((checkbox_obj) => {
      //     data.push({
      //       patient_name: patientsInfo[p].name,
      //       user_id: patientsInfo[p].patient_id,
      //       assigned_test_num: res1.data.getPatientAssignedTests.length,
      //       last_movement_tested: lastMovementAssigned,
      //       last_test_score: lastScore,
      //       movements_assigned: checkbox_obj
      //     });
      //   });

      //   // data.push({
      //   //   patient_name: patientsInfo[p].name,
      //   //   user_id: patientsInfo[p].patient_id,
      //   //   assigned_test_num: res1.data.getPatientAssignedTests.length,
      //   //   last_movement_tested: lastMovementAssigned,
      //   //   last_test_score: lastScore,
      //   //   movements_assigned: {}
      //   // });

      // }
      // console.log("data", data);
      // setLoading(false);
      // return data;
    } catch (err) {
      console.log(err);
      return new Promise((resolve, reject) => reject(err));
    }
  }

  useEffect(() => {
    console.log("in useeffect");
    fetchData().then((data) => updatePatientDataRowsArr(data));

    // data = testRows;
    // updatePatientDataRowsArr(data);
  }, []);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerTablePage(+event.target.value);
    setTablePage(0);
  };

  let paginationCount = patientDataRowsArr.length;
  if (searchResults.length > 0) {
    paginationCount = searchResults.length;
  }

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        overflow: "hidden",
        flexDirection: "column",
      }}
    >
      <div className="above-table-row">
        <AddPatientFullModal
          patientDataRowsArr={patientDataRowsArr}
          updatePatientDataRowsArr={updatePatientDataRowsArr}
          careProviderId={careProviderId}
        />
        <SearchForPatients
          patientDataRowsArr={patientDataRowsArr}
          updatePatientDataRowsArr={updatePatientDataRowsArr}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          setTablePage={setTablePage}
        />
      </div>

      <Box sx={{ color: "#000000", width: "100%" }}>
        <TableContainer
          sx={{
            maxWidth: "95%",
            margin: "0 2.5% 0 2.5%",
            border: 1,
            minHeight: 100,
            maxHeight: 500,
            overflow: "auto",
          }}
        >
          <Table stickyHeader>
            <TableHead>{FixedHeaderRow()}</TableHead>

            <TableBody>
              {searchResults.length > 0
                ? DisplaySearchResults({
                    tablePage,
                    rowsPerTablePage,
                    searchResults,
                    setSearchResults,
                    patientDataRowsArr,
                    updatePatientDataRowsArr,
                  })
                : DisplayRows({
                    tablePage,
                    rowsPerTablePage,
                    patientDataRowsArr,
                    updatePatientDataRowsArr,
                    loading,
                  })}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={paginationCount}
            rowsPerPage={rowsPerTablePage}
            page={tablePage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: 1, borderColor: "#000000", position: "sticky" }}
          />
        </TableContainer>
      </Box>
    </Box>
  );
}
