// import { Button } from "@mui/material";
// import AnalyticsCard from "../components/patient/AnalyticsCard";
// import FormControl from "@mui/material/FormControl";
// import InputLabel from "@mui/material/InputLabel";
// import NativeSelect from "@mui/material/NativeSelect";
// import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import TextField from "@mui/material/TextField";
// import * as React from "react";
// import dayjs from "dayjs";
// import { DataGrid } from "@mui/x-data-grid";
// import ScoreChart from "../components/patient/Charts";
// import { Grid, Paper } from "@mui/material";
// import { TestEventsTable } from "../components/patient/EventsTable";

// export default function Patient() {
//   const [movementTestSelected, setMovementTestSelected] = React.useState();
//   const [fromDate, setFromDate] = React.useState(dayjs("2014-08-18T21:11:54"));
//   const [toDate, setToDate] = React.useState(dayjs("2014-08-18T21:11:54"));

//   const handleChangeFromDate = (newValue) => {
//     setFromDate(newValue);
//   };

//   const handleChangeToDate = (newValue) => {
//     setToDate(newValue);
//   };
//   const columns = [
//     {
//       // field: "id",
//       field: "score",
//       headerName: "score",
//       sortable: false,
//       width: 70,
//     },
//     { field: "id", field: "movement", headerName: "Movement", width: 130 },
//     { field: "id", field: "date", headerName: "Date", width: 200 },
//     {
//       field: "id",
//       field: "notes",
//       headerName: "Notes",
//       sortable: false,
//       width: 130,
//     },
//   ];

//   const rows = [
//     {
//       id: 1,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//     {
//       id: 2,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//     {
//       id: 3,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//     {
//       id: 4,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//     {
//       id: 5,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//     {
//       id: 6,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//     {
//       id: 7,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//     {
//       id: 8,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//     {
//       id: 9,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//     {
//       id: 10,
//       score: 85,
//       movement: "sit to stand",
//       date: "9/17/2022, 1:21 PM",
//       notes: "",
//     },
//   ];
//   return (
//     <Grid container spacing={2}>
//       <Grid container item xs={5} direction="column">
//         <Paper>xs=8</Paper>
//         <Grid item>
//           <Button>Back</Button>
//         </Grid>
//         <Grid
//           item
//           container
//           direction="row"
//           justifyContent="space-evenly"
//           alignItems="flex-start"
//         >
//           <AnalyticsCard value={90} title="7-day average" change={12} />
//           <AnalyticsCard value={85} title="monthly average" change={0 - 5} />
//         </Grid>
//         <Grid item>
//           {/* select group */}

//           <Grid
//             container
//             direction="row"
//             justifyContent="flex-start"
//             alignItems="flex-start"
//           >
//             <TestSelection />
//             <LocalizationProvider dateAdapter={AdapterDayjs}>
//               <DesktopDatePicker
//                 label="From Date"
//                 inputFormat="MM/DD/YYYY"
//                 value={fromDate}
//                 onChange={handleChangeFromDate}
//                 renderInput={(params) => <TextField size="small" {...params} />}
//               />
//               <DesktopDatePicker
//                 label="To Date"
//                 inputFormat="MM/DD/YYYY"
//                 value={toDate}
//                 onChange={handleChangeToDate}
//                 renderInput={(params) => <TextField size="small" {...params} />}
//               />
//             </LocalizationProvider>
//           </Grid>
//           {/* chart */}
//           <ScoreChart />
//         </Grid>
//       </Grid>
//       <Grid item xs={7}>
//         <Paper>xs=8</Paper>
//         <Grid item style={{ height: 700, width: "100%" }}>
//           <TestEventsTable />
//         </Grid>
//       </Grid>
//       {/* <Grid item xs={4}>
//         <Paper>xs=8</Paper>
//       </Grid>
//       <Grid item xs={8}>
//         <Paper>xs=8</Paper>
//       </Grid> */}
//     </Grid>
//   );
// }

// function TestSelection({
//   testTypes = [
//     "sit to stand",
//     "One-foot Stand",
//     "Sitting with Back Unsupported",
//   ],
//   setMovementTestSelected,
// }) {
//   return (
//     <FormControl>
//       <InputLabel variant="standard" htmlFor="uncontrolled-native">
//         Type of Movement Test
//       </InputLabel>
//       <NativeSelect
//         defaultValue={30}
//         inputProps={{
//           name: "age",
//           id: "uncontrolled-native",
//         }}
//       >
//         {testTypes.map((test, index) => (
//           <option value={10}>{test}</option>
//         ))}
//         {/* <option value={10}>Ten</option>
//         <option value={20}>Twenty</option>
//         <option value={30}>Thirty</option> */}
//       </NativeSelect>
//     </FormControl>
//   );
// }
