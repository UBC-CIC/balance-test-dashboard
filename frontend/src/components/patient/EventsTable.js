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
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
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

function createData(name, calories, fat, carbs, protein) {
  return {
    name,
    calories,
    fat,
    carbs,
    protein,
  };
}

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

const rows = SIT_STAND_DATA.concat(
  ONE_FOOT_STAND_DATA.concat(SIT_UNSUPPORTED_DATA)
);

// const rows = [
//   {
//     id: 1,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
//   {
//     id: 2,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
//   {
//     id: 3,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
//   {
//     id: 4,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
//   {
//     id: 5,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
//   {
//     id: 6,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
//   {
//     id: 7,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
//   {
//     id: 8,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
//   {
//     id: 9,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
//   {
//     id: 10,
//     score: 85,
//     movement: "Sit to Stand",
//     date: "9/17/2022, 1:21 PM",
//     notes: "",
//   },
// ];

function descendingComparator(a, b, orderBy) {
  if (orderBy == "date") {
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
  const { numSelected, setOpenNewTest } = props;

  return (
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
      <Button variant="outlined" size="small">
        Delete
      </Button>
      <Button variant="contained" size="small" onClick={setOpenNewTest}>
        New
      </Button>
    </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

export default function TestEventsTable({ openNewTest, setOpenNewTest }) {
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("date");
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

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
  };

  const handleClick = (event, name) => {
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
        setOpenNewTest={setOpenNewTest}
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
                const isItemSelected = isSelected(row.name);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.name)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.name}
                    selected={isItemSelected}
                    align={"left"}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
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
                        row.score >= 50 ? { color: "green" } : { color: "red" }
                        // !row.score ? { color: "black" } : {row.score>= 50 ? { color: "green" } : { color: "red" }}
                        // () => {
                        //   if (!row.score) {
                        //     return { color: "black" };
                        //   }
                        //   if (row.score >= 50) {
                        //     return { color: "green" };
                        //   } else {
                        //     return { color: "red" };
                        //   }
                        // }
                      }
                    >
                      {row.score}
                    </TableCell>
                    <TableCell align="left">{row.movement}</TableCell>
                    <TableCell align="left">{row.date}</TableCell>
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
