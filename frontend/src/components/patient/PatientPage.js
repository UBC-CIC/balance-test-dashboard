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
import { RangeChart, ScoreChart } from "./Charts";
import Grid from "@mui/material/Grid";
import TestEventsTable from "./EventsTable";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import {
  SIT_STAND_DATA,
  ONE_FOOT_STAND_DATA,
  SIT_UNSUPPORTED_DATA,
  TEST_TYPES,
  MEASUREMENT_TYPES,
} from "../mockData/data";
import { useNavigate } from "react-router";
import { getTestEvents } from "../../graphql/queries";

const { Amplify, API, graphqlOperation } = require("aws-amplify");
const awsconfig = require("../../aws-exports");
const {
  createAndAssignTest,
  createPatient,
  putTestResult,
} = require("../../graphql/mutations");
Amplify.configure(awsconfig);

function PatientPage({ patient_id, patient_name }) {
  const [movementTestSelected, setMovementTestSelected] =
    React.useState("sit to stand");
  const [fromDate, setFromDate] = React.useState(dayjs("2023-02-03"));
  const [toDate, setToDate] = React.useState(dayjs("2023-02-10"));

  let navigate = useNavigate();
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      // query test events for the graph
      let response = await API.graphql(
        graphqlOperation(getTestEvents, {
          patient_id: patient_id,
          test_type: movementTestSelected,
          from_time: dayjs(fromDate).format("YYYY-MM-DD hh:mm:ss"),
          to_time: dayjs(toDate).format("YYYY-MM-DD hh:mm:ss"),
          if_completed: true,
          sort: "asc",
        })
      );

      console.log(response);
      setData(response.data.getTestEvents);
      console.log("data", data);
    })();
  }, [fromDate, toDate]);

  const handleChangeFromDate = (newValue) => {
    setFromDate(newValue);
    console.log(fromDate);
  };

  const handleChangeToDate = (newValue) => {
    setToDate(newValue);
  };

  const [openNewTest, setOpenNewTest] = React.useState(false);

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

  const scoreDataMapping = {
    "sit to stand": SIT_STAND_DATA,
    "One-foot Stand": ONE_FOOT_STAND_DATA,
    "Sitting with Back Unsupported": SIT_UNSUPPORTED_DATA,
  };

  return (
    <Grid
      container
      direction="column"
      justifyContent="space-evenly"
      alignItems="flex-start"
      spacing={2}
    >
      <Grid
        item
        container
        direction="column"
        justifyContent="center"
        alignItems="stretch"
        spacing={5}
      >
        {/* back button */}
        <Grid item>
          <Button
            onClick={() => {
              navigate("/");
            }}
          >
            Back
          </Button>
        </Grid>
        {/* page title */}
        <Grid item>
          <Typography variant="h5" gutterBottom>
            Statistics for {patient_name} ({patient_id})
          </Typography>
        </Grid>
        {/* analytics */}
        <Grid
          item
          container
          direction="row"
          justifyContent="space-evenly"
          alignItems="flex-start"
        >
          <AnalyticsCard value={90} title="7-day average" change={12} />
          <AnalyticsCard value={85} title="monthly average" change={0 - 5} />
        </Grid>
        {/* graph */}
        <Grid item>
          {/* select group */}

          <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-end"
            pl={10}
          >
            <TestSelection
              movementTestSelected={movementTestSelected}
              setMovementTestSelected={setMovementTestSelected}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DesktopDatePicker
                label="From Date"
                inputFormat="MM/DD/YYYY"
                value={fromDate}
                onChange={handleChangeFromDate}
                renderInput={(params) => <TextField size="small" {...params} />}
              />
              <DesktopDatePicker
                label="To Date"
                inputFormat="MM/DD/YYYY"
                value={toDate}
                onChange={handleChangeToDate}
                renderInput={(params) => <TextField size="small" {...params} />}
              />
            </LocalizationProvider>
          </Grid>
          {/* chart */}
          <Grid item>
            <ScoreChart
              data={
                movementTestSelected == "sit to stand"
                  ? data
                  : scoreDataMapping[movementTestSelected].filter(
                      (i) =>
                        dayjs(i.date).isAfter(fromDate) &&
                        dayjs(i.date).isBefore(toDate)
                    )
              }
            />
          </Grid>
          {/* measurement select */}
          <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-end"
            pl={10}
          >
            <MeasurementSelect />
          </Grid>
          <Grid item pl={5}>
            <RangeChart />
          </Grid>
        </Grid>
      </Grid>
      {/* table */}
      <Grid item style={{ height: 700, width: "100%" }}>
        <TestEventsTable
          openNewTest={openNewTest}
          setOpenNewTest={setOpenNewTest}
        />
      </Grid>
    </Grid>
  );
}

function TestSelection({
  movementTestSelected = TEST_TYPES[0],
  setMovementTestSelected,
}) {
  // const [age, setAge] = React.useState("");

  const handleChange = (event) => {
    setMovementTestSelected(event.target.value);
  };

  return (
    <div>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
        <InputLabel id="demo-simple-select-standard-label">
          Type of Movement Test
        </InputLabel>
        <Select
          labelId="demo-simple-select-standard-label"
          id="demo-simple-select-standard"
          value={movementTestSelected}
          onChange={handleChange}
          label="Type of Movement Test"
        >
          {TEST_TYPES.map((t) => (
            <MenuItem value={t}>{t}</MenuItem>
          ))}
          {/* <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem> */}
        </Select>
      </FormControl>
    </div>
  );
}

function MeasurementSelect({ measurementSelected = MEASUREMENT_TYPES[0] }) {
  // const [age, setAge] = React.useState("");

  const handleChange = (event) => {
    // setMovementTestSelected(event.target.value);
  };

  return (
    // <div>
    <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
      <InputLabel id="demo-simple-select-standard-label">
        Type of Measurement
      </InputLabel>
      <Select
        labelId="demo-simple-select-standard-label"
        id="demo-simple-select-standard"
        value={measurementSelected}
        onChange={handleChange}
        label="Type of Measurement"
      >
        {MEASUREMENT_TYPES.map((t) => (
          <MenuItem value={t}>{t}</MenuItem>
        ))}
        {/* <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem> */}
      </Select>
    </FormControl>
    // </div>
  );
}

export default PatientPage;
