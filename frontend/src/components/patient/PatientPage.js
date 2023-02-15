import { Button } from "@mui/material";
import AnalyticsCard from "./AnalyticsCard";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import NativeSelect from "@mui/material/NativeSelect";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import TextField from "@mui/material/TextField";
import * as React from "react";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";

function PatientPage({ patient_id }) {
  const [movementTestSelected, setMovementTestSelected] = React.useState();
  const [fromDate, setFromDate] = React.useState(dayjs("2014-08-18T21:11:54"));
  const [toDate, setToDate] = React.useState(dayjs("2014-08-18T21:11:54"));

  const handleChangeFromDate = (newValue) => {
    setFromDate(newValue);
  };

  const handleChangeToDate = (newValue) => {
    setToDate(newValue);
  };

  const columns = [
    {
      // field: "id",
      field: "score",
      headerName: "score",
      sortable: false,
      width: 70,
    },
    { field: "id", field: "movement", headerName: "Movement", width: 130 },
    { field: "id", field: "date", headerName: "Date", width: 200 },
    {
      field: "id",
      field: "notes",
      headerName: "Notes",
      sortable: false,
      width: 130,
    },
  ];

  const rows = [
    {
      id: 1,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
    {
      id: 2,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
    {
      id: 3,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
    {
      id: 4,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
    {
      id: 5,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
    {
      id: 6,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
    {
      id: 7,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
    {
      id: 8,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
    {
      id: 9,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
    {
      id: 10,
      score: 85,
      movement: "Sit to Stand",
      date: "9/17/2022, 1:21 PM",
      notes: "",
    },
  ];

  return (
    <div>
      <Button>Back</Button>
      {/* analytics */}
      <div>
        <AnalyticsCard value={90} title="7-day average" change={12} />
        <AnalyticsCard value={85} title="monthly average" change={0 - 5} />
      </div>
      {/* graph */}
      <div>
        {/* select group */}
        <div>
          <TestSelection />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DesktopDatePicker
              label="From Date"
              inputFormat="MM/DD/YYYY"
              value={fromDate}
              onChange={handleChangeFromDate}
              renderInput={(params) => <TextField {...params} />}
            />
            <DesktopDatePicker
              label="To Date"
              inputFormat="MM/DD/YYYY"
              value={toDate}
              onChange={handleChangeToDate}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </div>
        {/* chart */}
      </div>
      {/* table */}
      <div style={{ height: 700, width: "100%" }}>
        {/* table options */}
        {/* actual table */}
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20]}
          checkboxSelection
        />
      </div>
    </div>
  );
}

function TestSelection({
  testTypes = [
    "Sit to Stand",
    "One-foot Stand",
    "Sitting with Back Unsupported",
  ],
  setMovementTestSelected,
}) {
  return (
    <FormControl fullWidth>
      <InputLabel variant="standard" htmlFor="uncontrolled-native">
        Type of Movement Test
      </InputLabel>
      <NativeSelect
        defaultValue={30}
        inputProps={{
          name: "age",
          id: "uncontrolled-native",
        }}
      >
        {testTypes.map((test, index) => (
          <option value={10}>{test}</option>
        ))}
        {/* <option value={10}>Ten</option>
        <option value={20}>Twenty</option>
        <option value={30}>Thirty</option> */}
      </NativeSelect>
    </FormControl>
  );
}

export default PatientPage;
