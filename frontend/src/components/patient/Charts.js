import React, { PureComponent, useEffect, useState } from "react";
import ApexCharts from "apexcharts";
import { Box } from "@mui/material";
import Typography from "@mui/material/Typography";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Bar,
} from "recharts";
import Chart from "react-apexcharts";
import {
  MEASUREMENT_DATA_SMALL,
  MEASUREMENT_RANGE_DATA,
} from "../mockData/data";

import { getMeasurementRange } from "../../graphql/queries";
import dayjs from "dayjs";
import moment from "moment";
const { Amplify, API, Auth, graphqlOperation } = require("aws-amplify");
const awsconfig = require("../../aws-exports");
Amplify.configure(awsconfig);

export const ScoreChart = ({ data, range }) => {
  // console.log("chartdata", data);
  // console.log("range", range);
  const dateFormatter = (t) => {
    return moment(t).format("MMMM Do YYYY");
  };
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 20,
          right: 50,
          left: 20,
          bottom: 5,
        }}
        label={<NALabel />}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="start_time"
          type="number"
          tickFormatter={dateFormatter}
          domain={range}
        />
        <YAxis domain={[0, 100]} />
        {/* <Tooltip /> */}
        {/* <Legend /> */}
        <ReferenceLine
          y={85}
          label="OK"
          stroke="green"
          position="start"
          strokeDasharray="3 3"
        />
        <ReferenceLine
          y={60}
          label="Low"
          stroke="orange"
          position="end"
          strokeDasharray="3 3"
        />
        <ReferenceLine
          y={40}
          label="Very Low"
          stroke="red"
          position="end"
          strokeDasharray="3 3"
        />

        <Line
          type="monotone"
          dataKey="score"
          stroke="black"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const SensorChart = ({ data, y }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        width={500}
        height={600}
        data={data}
        margin={{
          top: 20,
          right: 50,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="ts" />
        <YAxis domain={[-20, 20]} dataKey={"val"} />
        <XAxis dataKey="timestamp" />
        <YAxis domain={[-20, 20]} />

        {/* <Tooltip /> */}
        {/* <Legend /> */}

        <Line
          type="monotone"
          dataKey={"val"}
          stroke="black"
          isAnimationActive={false}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const RangeChart = ({ patientId, measurement, fromDate, toDate }) => {
  let options = {
    chart: {
      type: "rangeBar",
      height: 100,
      animations: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: { enabled: false },
    xaxis: {
      labels: { trim: true, rotate: 15 },
      tickAmount: 6,
      type: "datetime",
      tickPlacement: "between",
      // min: dayjs(fromDate).format("DD/MM/YYYY"),
      // max: dayjs(fromDate).format("DD/MM/YYYY"),
    },
    yaxis: {
      decimalsInFloat: 2,
    },
    grid: { show: false },
    plotOptions: {
      bar: {
        columnWidth: "10%",
      },
    },
  };

  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      let sesh = await Auth.currentSession();
      let idtoken = sesh.idToken.jwtToken;
      let res = await API.graphql({
        query: getMeasurementRange,
        variables: {
          patient_id: patientId,
          measurement: measurement,
        },
        authToken: idtoken,
      });

      let rangeChartData = convert(res.data.getMeasurementRange);
      setData(rangeChartData);
    } catch (e) {
      setData(null);
    }
  };

  const convert = (data) => {
    const keys = Object.keys(data);

    const res = data[keys[0]].map((_, i) => {
      const item = {};
      keys.forEach((k) => {
        item[k] = data[k][i];
      });
      item["y"] = [item["min"], item["max"]];
      item["x"] = dayjs(
        `${item["year"]}-` +
          (item["month"] < 10 ? `0${item["month"]}` : `${item["month"]}`) +
          (item["day"] < 10 ? `0${item["day"]}` : `${item["day"]}`)
      ).format("YYYY MMM D");
      // .format("DD/MM/YYYY");
      return item;
    });

    return [{ data: res }];
  };

  useEffect(() => {
    // console.log("rangechart refresh");
    fetchData();
  }, [measurement]);

  return data ? (
    <div id="chart">
      <Chart
        options={options}
        // series={MEASUREMENT_RANGE_DATA}
        series={data}
        type="rangeBar"
        width="95%"
        height={300}
      />{" "}
    </div>
  ) : (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        "& > :not(style)": {
          m: 1,
          width: 200,
          height: 128,
        },
      }}
    >
      <Typography color="#D3D3D3">
        No measurement range data available. This data is updated once a day, so
        please check back tomorrow
      </Typography>
      {/* <Typography variant="subtitle1">No data available</Typography> */}
    </Box>
  );
};

function NALabel({ x, y, stroke, value, width }) {
  if (value) {
    // No label if there is a value. Let the cell handle it.
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      // Move slightly above axis
      dy={-10}
      // Center text
      dx={width / 2}
      fill={stroke}
      fontSize={15}
      textAnchor="middle"
    >
      N/A
    </text>
  );
}
