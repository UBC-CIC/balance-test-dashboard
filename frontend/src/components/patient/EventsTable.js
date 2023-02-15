import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";

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

const rows = [
  {
    id: 1,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
  {
    id: 2,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
  {
    id: 3,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
  {
    id: 4,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
  {
    id: 5,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
  {
    id: 6,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
  {
    id: 7,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
  {
    id: 8,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
  {
    id: 9,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
  {
    id: 10,
    score: 85,
    movement: "Sit to Stand",
    date: "9/17/2022, 1:21 PM",
    notes: "",
  },
];

export default function DataTable() {
  return (
    <div style={{ height: 700, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={20}
        rowsPerPageOptions={[20]}
        checkboxSelection
      />
    </div>
  );
}
