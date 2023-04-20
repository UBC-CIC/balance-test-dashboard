import React, { PureComponent, useEffect, useState } from "react";
import ApexCharts from "apexcharts";
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
  console.log("chartdata", data);
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

// export const RangeChart = () => {
//   let sales = true;
//   return (
//     <Bar
//       barSize={54}
//       animationBegin={400}
//       animationDuration={400}
//       dataKey={!sales ? "sales" : "volume"}
//       fill={sales ? "url(#linearGradient-1)" : "url(#linearGradient-2)"}
//       shape={<RoundBar />}
//     ></Bar>
//   );
// };

// const RoundBar = (props) => {
//   const moveTo = (x, y, { ry = 0, rx = 0 }) => `M${x + rx}, ${y + ry}`;
//   const lineTo = (x, y, { ry = 0, rx = 0 }) => `L${x + rx}, ${y + ry}`;
//   const quadraticCurveTo = (x, y, { ry = 0, rx = 0 }) =>
//     `Q${x}, ${y} ${x + rx} ${y + ry}`;

//   const drawRoundEdgesRectangle = (
//     points,
//     radius,
//     { radiusTop = true, radiusBottom = false }
//   ) => `${moveTo(points[0].x, points[0].y, { rx: radiusTop ? radius : 0 })}
//   ${quadraticCurveTo(points[0].x, points[0].y, { ry: radiusTop ? radius : 0 })}
//   ${lineTo(points[1].x, points[1].y, { ry: radiusBottom ? -radius : 0 })}
//   ${quadraticCurveTo(points[1].x, points[1].y, {
//     rx: radiusBottom ? radius : 0,
//   })}
//   ${lineTo(points[2].x, points[2].y, { rx: radiusBottom ? -radius : 0 })}
//   ${quadraticCurveTo(points[2].x, points[2].y, {
//     ry: radiusBottom ? -radius : 0,
//   })}
//   ${lineTo(points[3].x, points[3].y, { ry: radiusTop ? radius : 0 })}
//   ${quadraticCurveTo(points[3].x, points[3].y, { rx: radiusTop ? -radius : 0 })}
//   Z`;

//   const { fill, x, y, width, height, rem, volume } = props;
//   const color = rem ? "url(#linearGradient-rem)" : fill;
//   const radius = 3;
//   const haveRadiusBottom =
//     Array.isArray(volume) && volume[1] - volume[0] !== 0 && volume[0] !== 0;
//   const haveRadiusTop =
//     (Array.isArray(volume) && volume[1] - volume[0] !== 0) ||
//     (!Array.isArray(volume) && volume !== 0);
//   const points = [
//     { x, y },
//     { x, y: y + height },
//     { x: x + width, y: y + height },
//     { x: x + width, y },
//   ];
//   const d = drawRoundEdgesRectangle(points, radius, {
//     radiusBottom: haveRadiusBottom,
//     radiusTop: haveRadiusTop,
//   });
//   return <path d={d} stroke="none" fill={color} />;
// };

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
    // annotations: {
    //   yaxis: [
    //     {
    //       y: 0.2,
    //       borderColor: "gray",
    //       label: {
    //         borderColor: "gray",
    //         style: {
    //           color: "#fff",
    //           background: "gray",
    //         },
    //         text: "median: 0.2",
    //       },
    //     },
    //   ],
    // },
  };

  const [data, setData] = useState([]);

  const fetchData = async () => {
    let sesh = await Auth.currentSession();
    let idtoken = sesh.idToken.jwtToken;
    // console.log("measurement", measurement);
    let res = await API.graphql({
      query: getMeasurementRange,
      variables: {
        patient_id: patientId,
        measurement: measurement,
      },
      authToken: idtoken,
    });

    let rangeChartData = convert(res.data.getMeasurementRange);
    // console.log("rangechartdata", rangeChartData);
    setData(rangeChartData);
  };

  // let data = [
  //   {
  //     data: [
  //       { x: "11/20/2022, 10:01:13 PM", y: [-0.3484, 3.9108] },
  //       { x: "11/21/2022, 10:01:13 PM", y: [-1.7786, -0.1167] },
  //     ],
  //   },
  // ];
  const convert = (data) => {
    const keys = Object.keys(data);

    const res = data[keys[0]].map((_, i) => {
      const item = {};
      keys.forEach((k) => {
        item[k] = data[k][i];
      });
      item["y"] = [item["min"], item["max"]];
      // todo
      item["x"] = dayjs(
        `${item["year"]}-0${item["month"]}-${item["day"]}`
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

  return (
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
  );
};

function NALabel({ x, y, stroke, value, width }) {
  // console.log("x", x);
  // console.log("value", value);
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
