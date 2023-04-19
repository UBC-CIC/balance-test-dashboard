import * as React from "react";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import LoadingButton from "@mui/lab/LoadingButton";
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { visuallyHidden } from "@mui/utils";
import { Button } from "@mui/material";
import dayjs from "dayjs";
import {
  ONE_FOOT_STAND_DATA,
  SIT_STAND_DATA,
  SIT_UNSUPPORTED_DATA,
  TEST_TYPES,
} from "../mockData/data";
import MenuItem from "@mui/material/MenuItem";
import NewTestDialog from "./NewTestDialog";
import { Navigate, useNavigate } from "react-router";
import {
  deleteTestEventFromS3,
  deleteTestEventFromDB,
} from "../../graphql/mutations";

const { Amplify, API, Auth, graphqlOperation } = require("aws-amplify");
const awsconfig = require("../../aws-exports");
const { getTestEvents, getTestEventById } = require("../../graphql/queries");
Amplify.configure(awsconfig);

function createData(name, calories, fat, carbs, protein) {
  return {
    name,
    calories,
    fat,
    carbs,
    protein,
  };
}

const rows = SIT_STAND_DATA.concat(
  ONE_FOOT_STAND_DATA.concat(SIT_UNSUPPORTED_DATA)
);

function descendingComparator(a, b, orderBy) {
  if (orderBy == "date") {
    if (a[orderBy] == null) {
      return 1;
    }
    if (b[orderBy] == null) {
      return 1;
    }
    if (dayjs(b[orderBy]).isBefore(dayjs(a[orderBy]))) {
      return 1;
    } else {
      return -1;
    }
  }
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  {
    id: "score",
    numeric: false,
    disablePadding: true,
    label: "Balance Score",
  },
  {
    id: "movement",
    numeric: true,
    disablePadding: false,
    label: "Movement",
  },
  {
    id: "date",
    numeric: true,
    disablePadding: false,
    label: "Date",
  },
  {
    id: "notes",
    numeric: true,
    disablePadding: false,
    label: "Notes",
  },
];

function EnhancedTableHead(props) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              "aria-label": "select all desserts",
            }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={"left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

function EnhancedTableToolbar(props) {
  const { numSelected, eventsSelected, patientId, refresh } = props;
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleOpenDeleteDialog = () => {
    // console.log("199");
    setOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpen(false);
  };

  const handleDeleteTestEvents = async () => {
    setDeleting(true);
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;

    for (let i = 0; i < eventsSelected.length; i++) {
      let testEventResponse = await API.graphql({
        query: getTestEventById,
        variables: {
          test_event_id: eventsSelected[i],
          patient_id: patientId,
        },
        authToken: idtoken,
      });
      let eventDetails = testEventResponse.data.getTestEventById;
      let deleteFromS3Response = await API.graphql({
        query: deleteTestEventFromS3,
        variables: {
          test_event_id: eventsSelected[i],
          patient_id: patientId,
          year: dayjs(eventDetails.start_time).year(),
          month: dayjs(eventDetails.start_time).month() + 1,
          day: dayjs(eventDetails.start_time).date(),
          test_type: eventDetails.test_type,
        },
        authToken: idtoken,
      });
      // console.log("deleteFromS3Response", deleteFromS3Response);
      // console.log("patientid", patientId);
      let deleteFromDbResponse = await API.graphql({
        query: deleteTestEventFromDB,
        variables: {
          test_event_id: eventsSelected[i],
          patient_id: patientId,
        },
        authToken: idtoken,
      });
      // console.log("deleteFromDbResponse", deleteFromDbResponse);
      setDeleting(false);
      setOpen(false);
      refresh();
    }
  };

  return (
    <div>
      <Toolbar
      // sx={{
      //   pl: { sm: 2 },
      //   pr: { xs: 1, sm: 1 },
      //   ...(numSelected > 0 && {
      //     bgcolor: (theme) =>
      //       alpha(
      //         theme.palette.primary.main,
      //         theme.palette.action.activatedOpacity
      //       ),
      //   }),
      // }}
      >
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          All Test Events
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleOpenDeleteDialog}
        >
          Delete
        </Button>
      </Toolbar>
      <Dialog
        open={open}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Are you sure you want to delete these past test events?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Once the test events have been deleted, they can't be recovered.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <LoadingButton
            onClick={handleDeleteTestEvents}
            autoFocus
            loading={deleting}
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

function ConfirmDelete() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button variant="outlined" onClick={handleClickOpen}>
        Open alert dialog
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Use Google's location service?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Let Google help apps determine location. This means sending
            anonymous location data to Google, even when no apps are running.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Disagree</Button>
          <Button onClick={handleClose} autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default function TestEventsTable({
  openNewTest,
  setOpenNewTest,
  patient_id,
}) {
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("date");
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [rows, setRows] = React.useState([]);

  const navigate = useNavigate();

  const fetchData = async () => {
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;
    let resTestEvents = await API.graphql({
      query: getTestEvents,
      variables: {
        patient_id: patient_id,
        sort: "asc",
      },
      authToken: idtoken,
    });

    console.log("restestevents", resTestEvents);
    setRows(resTestEvents.data.getTestEvents);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.name);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
    // console.log("selected", selected);
  };

  const handleClick = (event, test_event_id) => {
    navigate(`/testDetails/${patient_id}/${test_event_id}`);
    // const selectedIndex = selected.indexOf(name);
    // let newSelected = [];
    // if (selectedIndex === -1) {
    //   newSelected = newSelected.concat(selected, name);
    // } else if (selectedIndex === 0) {
    //   newSelected = newSelected.concat(selected.slice(1));
    // } else if (selectedIndex === selected.length - 1) {
    //   newSelected = newSelected.concat(selected.slice(0, -1));
    // } else if (selectedIndex > 0) {
    //   newSelected = newSelected.concat(
    //     selected.slice(0, selectedIndex),
    //     selected.slice(selectedIndex + 1)
    //   );
    // }
    // setSelected(newSelected);
  };

  const handleCheck = (event, test_event_id) => {
    // console.log("in handlechecked");
    const selectedIndex = selected.indexOf(test_event_id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, test_event_id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
    // console.log("selected", selected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return (
    <Box sx={{ width: "100%" }}>
      {/* <Paper sx={{ width: "100%", mb: 2 }}> */}
      <EnhancedTableToolbar
        numSelected={selected.length}
        eventsSelected={selected}
        patientId={patient_id}
        refresh={fetchData}
      />
      <TableContainer>
        <Table
          sx={{ minWidth: 750 }}
          aria-labelledby="tableTitle"
          size={"small"}
        >
          <EnhancedTableHead
            numSelected={selected.length}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={handleSelectAllClick}
            onRequestSort={handleRequestSort}
            rowCount={rows.length}
          />
          <TableBody>
            {stableSort(rows, getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                const isItemSelected = isSelected(row.test_event_id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    // onClick={(event) => handleClick(event, row.test_event_id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.test_event_id}
                    selected={isItemSelected}
                    align={"left"}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onClick={(event) =>
                          handleCheck(event, row.test_event_id)
                        }
                        inputProps={{
                          "aria-labelledby": labelId,
                        }}
                      />
                    </TableCell>
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                      sx={
                        // row.balance_score >= 50
                        //   ? { color: "green" }
                        //   : { color: "red" }
                        // !row.score ? { color: "black" } : {row.score>= 50 ? { color: "green" } : { color: "red" }}
                        () => {
                          // if (!row.balance_score) {
                          //   return { color: "black" };
                          // } else if (row.balance_score >= 50) {
                          //   return { color: "green" };
                          // } else {
                          //   return { color: "red" };
                          // }

                          if (row.balance_score) {
                            return row.balance_score >= 50
                              ? { color: "green" }
                              : { color: "red" };
                          } else if (row.doctor_score) {
                            return row.doctor_score >= 50
                              ? { color: "green" }
                              : { color: "red" };
                          } else {
                            return { color: "black" };
                          }
                        }
                      }
                    >
                      {(() => {
                        if (row.balance_score) {
                          return row.balance_score;
                        } else if (row.doctor_score) {
                          return row.doctor_score;
                        } else {
                          return "Score is not available at this time";
                        }
                      })()}
                      {/* {!row.balance_score
                        ? "Calculating score ..."
                        : row.balance_score} */}
                    </TableCell>
                    <TableCell
                      align="left"
                      onClick={(event) => handleClick(event, row.test_event_id)}
                    >
                      {row.test_type}
                    </TableCell>
                    <TableCell align="left">
                      {!row.start_time
                        ? "Test has not been completed"
                        : dayjs(row.start_time).format("YYYY-MM-DD HH:mm")}
                    </TableCell>
                    <TableCell align="left">{row.notes}</TableCell>
                  </TableRow>
                );
              })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: (dense ? 33 : 53) * emptyRows,
                }}
              >
                <TableCell colSpan={3} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      {/* </Paper> */}
      <NewTestDialog open={openNewTest} setOpen={setOpenNewTest} />
    </Box>
  );
}
