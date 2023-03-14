import { Button, Grid } from "@mui/material";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { SensorChart } from "../components/patient/Charts";
import { useNavigate, useParams } from "react-router";
import {
  MEASUREMENT_DATA,
  MEASUREMENT_MAPPING,
  MEASUREMENT_TYPES,
} from "../components/mockData/data";
import { useEffect, useState } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import dayjs from "dayjs";
import LoadingButton from "@mui/lab/LoadingButton";
const { Amplify, API, graphqlOperation } = require("aws-amplify");
const awsconfig = require("../aws-exports");
const {
  getPatientById,
  getMeasurementData,
  getTestEventById,
  downloadTestEventDetails,
} = require("../graphql/queries");
Amplify.configure(awsconfig);

export function TestDetails() {
  const { patient_id, test_event_id } = useParams();
  const [patientName, setPatientName] = useState("");
  const [measurementSelected, setMeasurementSelected] = useState("");
  const [measurementData, setMeasurementData] = useState([]);
  const [testEvent, setTestEvent] = useState(null);
  const [downloading, setDownloading] = useState(false);
  let navigate = useNavigate();

  const fetchData = async () => {
    let resPatient = await API.graphql(
      graphqlOperation(getPatientById, { patient_id: patient_id })
    );
    setPatientName(resPatient.data.getPatientById.name);
    let resTest = await API.graphql(
      graphqlOperation(getTestEventById, { test_event_id: test_event_id })
    );
    console.log("resTest", resTest);
    setTestEvent(resTest.data.getTestEventById);
  };

  const fetchMeasurement = async () => {
    if (testEvent) {
      let resmeasurement = await API.graphql(
        graphqlOperation(getMeasurementData, {
          test_event_id: test_event_id,
          test_type: "sit-to-stand",
          year: dayjs(testEvent.start_time).year(),
          month: dayjs(testEvent.start_time).month() + 1,
          day: dayjs(testEvent.start_time).date(),
          patient_id: patient_id,
          measurement: measurementSelected,
        })
      );
      setMeasurementData(
        resmeasurement.data.getMeasurementData.ts.map((ts, i) => ({
          ts: ts,
          val: resmeasurement.data.getMeasurementData.val[i],
        }))
      );
      console.log("measurementData", measurementData);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchMeasurement();
  }, [measurementSelected]);

  const handleChange = (event) => {
    setMeasurementSelected(event.target.value);
    console.log("measurementSelected", measurementSelected);
  };

  const handleDownload = async (e) => {
    setDownloading(true);
    let resdownload = await API.graphql(
      graphqlOperation(downloadTestEventDetails, {
        test_event_id: test_event_id,
        test_type: "sit-to-stand",
        year: dayjs(testEvent.start_time).year(),
        month: dayjs(testEvent.start_time).month() + 1,
        day: dayjs(testEvent.start_time).date(),
        patient_id: patient_id,
        measurement: measurementSelected,
        patient_name: patientName,
      })
    );
    let url = resdownload.data.downloadTestEventDetails;
    console.log("url", url);
    let link = document.createElement("a");
    link.download = url;
    link.href = url;
    link.click();
    setDownloading(false);
  };

  return (
    <Grid container direction={"column"} spacing={4}>
      <Grid item>
        <Button
          onClick={() => {
            navigate(`/patient/${patient_id}`);
          }}
        >
          Back
        </Button>
      </Grid>
      <Grid item container direction="row" justifyContent="space-between">
        <Typography variant="h5" gutterBottom inline>
          Test Event Details, {patientName} ({patient_id})
        </Typography>
        <Grid>
          <Button variant="outlined">Delete</Button>
          <LoadingButton
            variant="contained"
            loading={downloading}
            onClick={handleDownload}
          >
            {downloading ? "Fetching..." : "Download"}
          </LoadingButton>
        </Grid>
      </Grid>
      <Grid item container justifyContent="center">
        <Grid item>
          <Table
            //    sx={{ maxWidth: "100%" }}
            aria-label="simple table"
          >
            <TableHead>
              <TableRow>
                <TableCell align="left">Movement</TableCell>
                <TableCell align="left">Balance Score (%)</TableCell>
                <TableCell align="left">Date</TableCell>
                <TableCell align="left">Duration</TableCell>
                <TableCell align="left">Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow
                //   key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                {/* todo: replace w var */}
                <TableCell align="left">sit-to-stand</TableCell>
                <TableCell align="left">
                  {!testEvent ? "loading..." : testEvent.balance_score}
                  {() => {
                    if (!testEvent) {
                      return "loading";
                    } else if (!testEvent.balance_score) {
                      return "Calculating...";
                    } else {
                      return testEvent.balance_score;
                    }
                  }}
                </TableCell>
                <TableCell align="left">
                  {!testEvent
                    ? "loading..."
                    : dayjs(testEvent.start_time).format("YYYY-MM-DD hh:mm")}
                </TableCell>
                <TableCell align="left">
                  {!testEvent
                    ? "loading..."
                    : dayjs(testEvent.end_time).diff(
                        dayjs(testEvent.start_time),
                        "second"
                      )}
                  s
                </TableCell>
                <TableCell align="left"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
      </Grid>
      <Grid
        item
        // container
        // spacing={5}
        // direction="column"
        // justifyContent="center"
      >
        <FormControl variant="standard" sx={{ m: 1, minWidth: 350 }}>
          <InputLabel id="demo-simple-select-standard-label">
            Select a Measurement to View Raw Data
          </InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            value={measurementSelected}
            onChange={handleChange}
            label="Age"
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {/* <MenuItem value={10}>Ten</MenuItem>
            <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem> */}
            {/* {MEASUREMENT_TYPES.map((m) => {
              <MenuItem value={m}>{m}</MenuItem>;
            })} */}
            {MEASUREMENT_TYPES.map((t) => (
              <MenuItem value={MEASUREMENT_MAPPING[t]}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {measurementData.length > 0 ? (
          <SensorChart data={measurementData} y={measurementSelected} />
        ) : (
          <div></div>
        )}
      </Grid>
    </Grid>
  );
}
