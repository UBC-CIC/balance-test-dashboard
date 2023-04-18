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
import moment from "moment";
import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import { RangeChart, ScoreChart } from "./Charts";
import Grid from "@mui/material/Grid";
import TestEventsTable from "./EventsTable";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import {
  // exportComponentAsJPEG,
  exportComponentAsPDF,
  // exportComponentAsPNG,
} from "react-component-export-image";
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
  getScoreStatsOverTime,
  getTestEvents,
} from "../../graphql/queries";

const { Amplify, API, graphqlOperation, Auth } = require("aws-amplify");
const awsconfig = require("../../aws-exports");
const {
  createAndAssignTest,
  createPatient,
  putTestResult,
} = require("../../graphql/mutations");
Amplify.configure(awsconfig);
// Amplify.configure({
//   API: {
//     // aws_appsync_graphqlEndpoint:
//     //   "https://xxxxxxxxxxxxxxxxxxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql",
//     // aws_appsync_region: "us-east-1",
//     // aws_appsync_authenticationType: "NONE",
//     graphql_headers: async () => ({
//       Authorization: (await Auth.currentSession()).getIdToken().getJwtToken(),
//     }),
//   },
// });

function PatientPage() {
  // { patient_id, patient_name }
  const { patient_id } = useParams();
  const [patientName, setPatientName] = React.useState("");
  const [movementTestSelected, setMovementTestSelected] =
    React.useState("sit-to-stand");
  const [fromDate, setFromDate] = React.useState(dayjs().subtract(1, "month"));
  const [toDate, setToDate] = React.useState(dayjs());
  const [measurementSelected, setMeasurementSelected] = React.useState(null);
  const [weeklyAvg, setWeeklyAvg] = React.useState(null);
  const [changeFromLastWeek, setChangeFromLastWeek] = React.useState(null);
  const [monthlyAvg, setMonthlyAvg] = React.useState(null);
  const [changeFromLastMonth, setChangeFromLastMonth] = React.useState(null);

  let navigate = useNavigate();
  const [data, setData] = React.useState([]);

  const fetchData = async () => {
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;
    console.log(idtoken);
    // get analytics
    // console.log("62");
    let resWeeklyAvg = await API.graphql({
      query: getScoreStatsOverTime,
      variables: {
        patient_id: patient_id,
        from_time: dayjs().subtract(7, "day").format("YYYY-MM-DD hh:mm:ss"),
        to_time: dayjs().format("YYYY-MM-DD hh:mm:ss"),
        stat: "avg",
      },
      authToken: idtoken,
    });
    let resLastWeekAvg = await API.graphql({
      query: getScoreStatsOverTime,
      variables: {
        patient_id: patient_id,
        from_time: dayjs().subtract(14, "day").format("YYYY-MM-DD hh:mm:ss"),
        to_time: dayjs().subtract(7, "day").format("YYYY-MM-DD hh:mm:ss"),
        stat: "avg",
      },
      authToken: idtoken,
    });
    console.log("monthly avg input", {
      patient_id: patient_id,
      from_time: dayjs().subtract(1, "month").format("YYYY-MM-DD hh:mm:ss"),
      to_time: dayjs().format("YYYY-MM-DD hh:mm:ss"),
      stat: "avg",
    });
    let resMonthlyAvg = await API.graphql({
      query: getScoreStatsOverTime,
      variables: {
        patient_id: patient_id,
        from_time: dayjs().subtract(1, "month").format("YYYY-MM-DD hh:mm:ss"),
        to_time: dayjs().format("YYYY-MM-DD hh:mm:ss"),
        stat: "avg",
      },
      authToken: idtoken,
    });
    let resLastMonthAvg = await API.graphql({
      query: getScoreStatsOverTime,
      variables: {
        patient_id: patient_id,
        from_time: dayjs().subtract(2, "month").format("YYYY-MM-DD hh:mm:ss"),
        to_time: dayjs().subtract(1, "month").format("YYYY-MM-DD hh:mm:ss"),
        stat: "avg",
      },
      authToken: idtoken,
    });
    setMonthlyAvg(parseFloat(resMonthlyAvg.data.getScoreStatsOverTime));
    setWeeklyAvg(parseFloat(resWeeklyAvg.data.getScoreStatsOverTime));
    setChangeFromLastMonth(
      resLastMonthAvg.data.getScoreStatsOverTime == null
        ? null
        : (resMonthlyAvg.data.getScoreStatsOverTime -
            resLastMonthAvg.data.getScoreStatsOverTime) /
            resLastMonthAvg.data.getScoreStatsOverTime
    );
    setChangeFromLastWeek(
      resLastWeekAvg.data.getScoreStatsOverTime == null
        ? null
        : (resWeeklyAvg.data.getScoreStatsOverTime -
            resLastWeekAvg.data.getScoreStatsOverTime) /
            resLastWeekAvg.data.getScoreStatsOverTime
    );

    // console.log("79");
    // setWeeklyAvg(Math.round(resWeeklyAvg.data.getScoreStatsOverTime));
    // setMonthlyAvg(Math.round(resMonthlyAvg.data.getScoreStatsOverTime));

    // query test events for the graph

    let resPatient = await API.graphql({
      query: getPatientById,
      variables: { patient_id: patient_id },
      // authMode: "AWS_LAMBDA",
      authToken: idtoken,
    });
    setPatientName(
      `${resPatient.data.getPatientById.last_name}, ${resPatient.data.getPatientById.first_name}`
    );
    let resEventsGraph = await API.graphql({
      query: getTestEvents,
      variables: {
        patient_id: patient_id,
        test_type: movementTestSelected,
        from_time: dayjs(fromDate).format("YYYY-MM-DD hh:mm:ss"),
        to_time: dayjs(toDate).format("YYYY-MM-DD hh:mm:ss"),
        sort: "asc",
      },
      authToken: idtoken,
    });

    // console.log("gettesteventsinput", {
    //   patient_id: patient_id,
    //   test_type: movementTestSelected,
    //   from_time: dayjs(fromDate).format("YYYY-MM-DD hh:mm:ss"),
    //   to_time: dayjs(toDate).format("YYYY-MM-DD hh:mm:ss"),
    //   sort: "asc",
    // });

    // console.log(resEventsGraph);
    setData(
      resEventsGraph.data.getTestEvents
      // .map((te) => ({
      //   start_time: dayjs(te.start_time).format("YYYY MMM D"),
      //   balance_score: te.balance_score,
      // }))
    );
    // console.log("data", data);
  };

  React.useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const handleChangeFromDate = (newValue) => {
    setFromDate(newValue);
    // console.log(fromDate);
  };

  const handleChangeToDate = (newValue) => {
    setToDate(newValue);
  };

  const handleSelectMeasurement = (event) => {
    setMeasurementSelected(event.target.value);
  };
  const ref = React.useRef(null);
  const downloadScoreGraph = () => {
    // saveSvgAsPng(document.getElementById("scoreChart"), "scores.png");
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
              navigate("/patientTable");
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
          {/* todo: replace w real data */}
          {/* <AnalyticsCard title="7-day average" value={weeklyAvg} />
          <AnalyticsCard title="monthly average" value={monthlyAvg} /> */}
          <AnalyticsCard
            title="7-day average"
            value={weeklyAvg}
            change={changeFromLastWeek * 100}
          />
          <AnalyticsCard
            title="monthly average"
            value={monthlyAvg}
            change={changeFromLastMonth * 100}
          />
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
            <Button
              variant="outlined"
              onClick={() => {
                exportComponentAsPDF(ref, {
                  pdfOptions: { w: 250, h: 90, orientation: "l" },
                  fileName: "scores",
                });
              }}
            >
              Download Graph
            </Button>
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
              <div ref={ref}>
                <ScoreChart
                  data={
                    movementTestSelected == "sit-to-stand"
                      ? data
                          .map((te) => ({
                            start_time: moment(te.start_time).valueOf(),
                            balance_score: te.balance_score,
                          }))
                          .filter(
                            (i) =>
                              dayjs(i.start_time).isAfter(fromDate) &&
                              dayjs(i.start_time).isBefore(toDate)
                          )
                      : scoreDataMapping[movementTestSelected].filter(
                          (i) =>
                            dayjs(i.date).isAfter(fromDate) &&
                            dayjs(i.date).isBefore(toDate)
                        )
                  }
                  range={[
                    moment(dayjs(fromDate).format()).valueOf(),
                    moment(dayjs(toDate).format()).valueOf(),
                  ]}
                />
              </div>
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
                fromDate={fromDate}
                toDate={toDate}
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
