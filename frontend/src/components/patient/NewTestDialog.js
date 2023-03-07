import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Checkbox from "@mui/material/Checkbox";
import { TEST_TYPES } from "../mockData/data";
import dayjs from "dayjs";
import {
  SIT_STAND_DATA,
  ONE_FOOT_STAND_DATA,
  SIT_UNSUPPORTED_DATA,
} from "../mockData/data";

export default function FormDialog({ open, setOpen }) {
  //   const [open, setOpen] = React.useState(false);

  const [testsSelected, setTestsSelected] = React.useState([]);
  const scoreDataMapping = {
    "sit to stand": SIT_STAND_DATA,
    "One-foot Stand": ONE_FOOT_STAND_DATA,
    "Sitting with Back Unsupported": SIT_UNSUPPORTED_DATA,
  };
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setTestsSelected([]);
  };

  const handleSendSubmit = () => {
    // for (let t in testsSelected) {
    //   scoreDataMapping[t].push({
    //     date: dayjs(),
    //     score: "-",
    //     notes: "Patient has not taken the test",
    //     movement: t,
    //   });
    // }
    handleClose();
  };

  const handleChange = (event) => {
    setTestsSelected([...testsSelected, event.target.name]);
  };

  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        {/* <DialogTitle>Assign a New Test to John Doe</DialogTitle> */}
        {/* <DialogContent> */}
        {/* <DialogContentText>Assign a New Test to John Doe</DialogContentText> */}
        <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
          <FormLabel component="legend">
            Assign a New Test to John Doe
          </FormLabel>
          <FormGroup>
            {TEST_TYPES.map((t) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={testsSelected.includes(t)}
                    onChange={handleChange}
                    name={t}
                  />
                }
                label={t}
              />
            ))}
            {/* <FormControlLabel
                control={
                  <Checkbox
                    checked={gilad}
                    onChange={handleChange}
                    name="gilad"
                  />
                }
                label="Gilad Gray"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={jason}
                    onChange={handleChange}
                    name="jason"
                  />
                }
                label="Jason Killian"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={antoine}
                    onChange={handleChange}
                    name="antoine"
                  />
                }
                label="Antoine Llorca"
              /> */}
          </FormGroup>
          {/* <FormHelperText>Be careful</FormHelperText> */}
        </FormControl>
        {/* </DialogContent> */}
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSendSubmit} variant="contained">
            Send Test
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
