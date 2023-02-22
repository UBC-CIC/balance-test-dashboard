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
import { useNavigate } from "react-router";
import {
  MEASUREMENT_DATA,
  MEASUREMENT_TYPES,
} from "../components/mockData/data";

export function TestDetails() {
  let navigate = useNavigate();
  return (
    <Grid container direction={"column"} spacing={4}>
      <Grid item>
        <Button
          onClick={() => {
            navigate("/patient");
          }}
        >
          Back
        </Button>
      </Grid>
      <Grid item>
        <Typography variant="h5" gutterBottom>
          Test Event Details, John Doe (1289946324)
        </Typography>
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
                <TableCell align="left">Sit to Stand</TableCell>
                <TableCell align="left">80</TableCell>
                <TableCell align="left">2023/2/18</TableCell>
                <TableCell align="left">54 s</TableCell>
                <TableCell align="left"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
      </Grid>
      <Grid item>
        {MEASUREMENT_TYPES.map((m) => (
          <div>
            {m}
            <SensorChart data={MEASUREMENT_DATA} />
          </div>
        ))}
      </Grid>
    </Grid>
  );
}
