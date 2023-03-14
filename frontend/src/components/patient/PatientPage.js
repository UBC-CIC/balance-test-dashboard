import { Button, Paper } from "@mui/material";
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
import { Box } from "@mui/material";
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
  MEASUREMENT_MAPPING,
} from "../mockData/data";
import { useNavigate, useParams } from "react-router";
import {
  getPatientById,
  getScoreMetricsOverTime,
  getTestEvents,
} from "../../graphql/queries";

const { Amplify, API, graphqlOperation } = require("aws-amplify");
const awsconfig = require("../../aws-exports");
const {
  createAndAssignTest,
  createPatient,
  putTestResult,
} = require("../../graphql/mutations");
Amplify.configure(awsconfig);

function PatientPage() {
  // { patient_id, patient_name }
  const { patient_id } = useParams();
  const [patientName, setPatientName] = React.useState("");
  const [movementTestSelected, setMovementTestSelected] =
    React.useState("sit-to-stand");
  const [fromDate, setFromDate] = React.useState(dayjs().subtract(1, "month"));
  const [toDate, setToDate] = React.useState(dayjs());
  const [measurementSelected, setMeasurementSelected] = React.useState(null);

  let navigate = useNavigate();
  const [data, setData] = React.useState([]);

  const fetchData = async () => {
    // get analytics
    // console.log("getweeklyavginput", {
    //   patientId: patient_id,
    //   from_time: dayjs().subtract(7, "day").format("YYYY-MM-DD hh:mm:ss"),
    //   to_time: dayjs().format("YYYY-MM-DD hh:mm:ss"),
    //   metrics: "avg",
    // });

    // let resWeeklyAvg = await API.graphql(
    //   graphqlOperation(getScoreMetricsOverTime, {
    //     patientId: patient_id,
    //     from_time: dayjs().subtract(7, "day").format("YYYY-MM-DD hh:mm:ss"),
    //     to_time: dayjs().format("YYYY-MM-DD hh:mm:ss"),
    //     metrics: "avg",
    //   })
    // );

    // console.log(resWeeklyAvg.data.getScoreMetricsOverTime);

    // query test events for the graph
    let resPatient = await API.graphql(
      graphqlOperation(getPatientById, { patient_id: patient_id })
    );
    setPatientName(resPatient.data.getPatientById.name);
    console.log("resPatient", resPatient);
    let resEventsGraph = await API.graphql(
      graphqlOperation(getTestEvents, {
        patient_id: patient_id,
        test_type: movementTestSelected,
        from_time: dayjs(fromDate).format("YYYY-MM-DD hh:mm:ss"),
        to_time: dayjs(toDate).format("YYYY-MM-DD hh:mm:ss"),
        sort: "asc",
      })
    );

    console.log("gettesteventsinput", {
      patient_id: patient_id,
      test_type: movementTestSelected,
      from_time: dayjs(fromDate).format("YYYY-MM-DD hh:mm:ss"),
      to_time: dayjs(toDate).format("YYYY-MM-DD hh:mm:ss"),
      sort: "asc",
    });

    console.log(resEventsGraph);
    setData(resEventsGraph.data.getTestEvents);
    console.log("data", data);
  };

  React.useEffect(() => {
    console.log(patient_id);
    fetchData();
  }, [fromDate, toDate]);

  const handleChangeFromDate = (newValue) => {
    setFromDate(newValue);
    console.log(fromDate);
  };

  const handleChangeToDate = (newValue) => {
    setToDate(newValue);
  };

  const handleSelectMeasurement = (event) => {
    setMeasurementSelected(event.target.value);
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
    "sit-to-stand": SIT_STAND_DATA,
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
            Statistics for {patientName} ({patient_id})
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
          <AnalyticsCard title="7-day average" value={65} />
          <AnalyticsCard title="monthly average" value={65} />
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
            {data.length == 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignContent: "center",
                  "& > :not(style)": {
                    m: 1,
                    width: 128,
                    height: 128,
                  },
                }}
              >
                <div color="gray">No score data available</div>
                {/* <Typography variant="subtitle1">No data available</Typography> */}
              </Box>
            ) : (
              <ScoreChart
                data={
                  movementTestSelected == "sit-to-stand"
                    ? data
                    : scoreDataMapping[movementTestSelected].filter(
                        (i) =>
                          dayjs(i.date).isAfter(fromDate) &&
                          dayjs(i.date).isBefore(toDate)
                      )
                }
              />
            )}
          </Grid>
          {/* measurement select */}

          <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-end"
            pl={10}
          >
            {/* <MeasurementSelect /> */}
            <FormControl variant="standard" sx={{ m: 1, minWidth: 320 }}>
              <InputLabel id="demo-simple-select-standard-label">
                View Measurement Range Over Time
              </InputLabel>
              <Select
                labelId="demo-simple-select-standard-label"
                id="demo-simple-select-standard"
                value={measurementSelected}
                onChange={handleSelectMeasurement}
                label="Type of Measurement"
              >
                <MenuItem value={null}>
                  View Measurement Range Over Time
                </MenuItem>
                {MEASUREMENT_TYPES.map((t) => (
                  <MenuItem value={MEASUREMENT_MAPPING[t]}>{t}</MenuItem>
                ))}
                {/* <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem> */}
              </Select>
            </FormControl>
          </Grid>
          <Grid item pl={5}>
            {!measurementSelected ? (
              <div></div>
            ) : (
              <RangeChart
                patientId={patient_id}
                measurement={measurementSelected}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
      {/* table */}
      <Grid item style={{ height: 700, width: "100%" }}>
        <TestEventsTable
          openNewTest={openNewTest}
          setOpenNewTest={setOpenNewTest}
          patient_id={patient_id}
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
  // const [measurementSelected, setMeasurementSelected] = React.useState("");

  const handleChange = (event) => {
    // setMovementTestSelected(event.target.value);
  };

  return (
    // <div>
    <FormControl variant="standard" sx={{ m: 1, minWidth: 350 }}>
      <InputLabel
        id="demo-simple-select-standard-label"
        sx={{ m: 1, minWidth: 350 }}
      >
        View Measurement Range Over Time
      </InputLabel>
      <Select
        labelId="demo-simple-select-standard-label"
        id="demo-simple-select-standard"
        value={measurementSelected}
        onChange={handleChange}
        label="Type of Measurement"
      >
        <MenuItem value={null}>View Measurement Range Over Time</MenuItem>
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
