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

export function TestDetails() {
  return (
    <Grid container direction={"column"}>
      <Grid item>
        <Button>Back</Button>
      </Grid>
      <Grid item>
        <Typography variant="h5" gutterBottom>
          Test Event Details, John Doe (1289946324)
        </Typography>
      </Grid>
      <Grid item>
        <Table sx={{ minWidth: "50%" }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Movement</TableCell>
              <TableCell align="right">Balance Score (%)</TableCell>
              <TableCell align="right">Date</TableCell>
              <TableCell align="right">Duration</TableCell>
              <TableCell align="right">Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow
              //   key={row.name}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                "Sit to Stand"
              </TableCell>
              <TableCell align="right">80</TableCell>
              <TableCell align="right">2023/2/18</TableCell>
              <TableCell align="right">54 s</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Grid>
      <Grid item>
        <SensorChart />
      </Grid>
    </Grid>
  );
}
