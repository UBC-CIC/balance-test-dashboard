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
import { GRAPHQL_AUTH_MODE } from "@aws-amplify/api";
const {
  Amplify,
  API,
  graphqlOperation,
  Auth,
  Storage,
} = require("aws-amplify");
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
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;
    let reslambdaauth = await API.graphql({
      query: getTestEventById,
      variables: { test_event_id: test_event_id, patient_id: patient_id },
      // authMode: GRAPHQL_AUTH_MODE.AWS_LAMBDA,
      authToken: `${idtoken}`,
      // headers: {
      //   Authorization: `prefix-${idtoken}`,
      // },
    });
    console.log("patientparams", {
      query: getPatientById,
      variables: { patient_id: patient_id },
      authToken: idtoken,
    });
    let resPatient = await API.graphql({
      query: getPatientById,
      variables: { patient_id: patient_id },
      authToken: idtoken,
    });
    console.log("respatient", resPatient);
    if (resPatient.data.getPatientById) {
      setPatientName(
        `${resPatient.data.getPatientById.last_name}, ${resPatient.data.getPatientById.first_name}`
      );
    }
    let resTest = await API.graphql({
      query: getTestEventById,
      variables: {
        test_event_id: test_event_id,
        patient_id: patient_id,
      },
      authToken: idtoken,
    });

    setTestEvent(resTest.data.getTestEventById);
  };

  const fetchMeasurement = async (measurement) => {
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;

    // todo: comment
    // if (testEvent) {
    let resmeasurement = await API.graphql({
      query: getMeasurementData,
      variables: {
        test_event_id: test_event_id,
        test_type: "sit-to-stand",
        year: dayjs(testEvent.start_time).year(),
        month: dayjs(testEvent.start_time).month() + 1,
        day: dayjs(testEvent.start_time).date(),
        patient_id: patient_id,
        measurement: measurement,
      },
      // authMode: GRAPHQL_AUTH_MODE.AWS_LAMBDA,
      // authToken: `1`,

      authToken: `${idtoken}`,
    });
    console.log("resmeasurement", resmeasurement);
    setMeasurementData(
      resmeasurement.data.getMeasurementData.ts.map((ts, i) => ({
        ts: ts,
        val: resmeasurement.data.getMeasurementData.val[i],
      }))
    );
    // }
  };

  useEffect(() => {
    fetchData();
  }, []);
  let isFirstRender = true;
  // useEffect(() => {
  //   // console.log("121");
  //   // if (isFirstRender) {
  //   //   console.log("is first render");
  //   //   fetchData();
  //   //   isFirstRender = false;
  //   //   return;
  //   // } else {
  //   if (testEvent) {
  //     fetchMeasurement();
  //   }
  //   // }
  // }, [measurementSelected]);

  const handleChange = (event) => {
    setMeasurementSelected(event.target.value);
    if (testEvent) {
      fetchMeasurement(event.target.value);
    }
  };

  const handleDownload = async (e) => {
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;

    setDownloading(true);
    console.log("patientid", patient_id);
    console.log("patientname", patientName);
    let downloadVariable = {
      test_event_id: test_event_id,
      test_type: "sit-to-stand",
      year: dayjs(testEvent.start_time).year(),
      month: dayjs(testEvent.start_time).month() + 1,
      day: dayjs(testEvent.start_time).date(),
      patient_id: patient_id,
      patient_name: patientName,
    };
    console.log("download variable", downloadVariable);
    let resdownload = await API.graphql({
      query: downloadTestEventDetails,
      variables: downloadVariable,
      authToken: idtoken,
    });
    let pdfUrl = resdownload.data.downloadTestEventDetails.pdf_url;
    // window.open(pdfUrl);
    let rawUrl = resdownload.data.downloadTestEventDetails.raw_url;
    // window.open(rawUrl);

    let downloadLink = document.createElement("a");
    downloadLink.download = rawUrl;
    downloadLink.href = rawUrl;
    downloadLink.click();
    await new Promise((resolve) => setTimeout(resolve, 300));
    downloadLink.download = pdfUrl;
    downloadLink.href = pdfUrl;
    downloadLink.click();
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
          Test Event Details: {patientName} ({patient_id})
        </Typography>
        <Grid>
          {/* <Button variant="outlined">Delete</Button> */}
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
                  {/* {!testEvent ? "loading..." : testEvent.balance_score} */}
                  {(() => {
                    if (!testEvent) {
                      return "loading";
                    } else if (
                      !testEvent.balance_score &&
                      !testEvent.doctor_score
                    ) {
                      return "Calculating...";
                    } else if (testEvent.balance_score) {
                      return testEvent.balance_score;
                    } else {
                      return testEvent.doctor_score;
                    }
                  })()}
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
