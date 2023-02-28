import React, { PureComponent, useEffect } from "react";
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
import { MEASUREMENT_RANGE_DATA } from "../mockData/data";

export const ScoreChart = ({ data }) => {
  console.log("chartdata", data);
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
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="start_time" />
        <YAxis />
        {/* <Tooltip /> */}
        {/* <Legend /> */}
        <ReferenceLine y={85} label="OK" stroke="green" position="start" />
        <ReferenceLine y={60} label="Low" stroke="red" position="end" />
        <ReferenceLine y={40} label="Very Low" stroke="red" position="end" />

        <Line
          type="monotone"
          dataKey="balance_score"
          stroke="black"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const SensorChart = ({ data }) => {
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
        <XAxis dataKey="timestamp" />
        <YAxis domain={[-5, 5]} />
        {/* <Tooltip /> */}
        {/* <Legend /> */}

        <Line
          type="monotone"
          dataKey="measurement"
          stroke="black"
          isAnimationActive={false}
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

export const RangeChart = () => {
  let options = {
    chart: {
      type: "rangeBar",
      height: 100,
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
    xaxis: { labels: { trim: true, rotate: 15 }, tickAmount: 6 },
    grid: { show: false },
    annotations: {
      yaxis: [
        {
          y: 0.2,
          borderColor: "gray",
          label: {
            borderColor: "gray",
            style: {
              color: "#fff",
              background: "gray",
            },
            text: "median: 0.2",
          },
        },
      ],
    },
  };

  // let state = {
  //   series: [
  //     {
  //       data: [
  //         {
  //           x: "Team A",
  //           y: [1, 5],
  //         },
  //         {
  //           x: "Team B",
  //           y: [4, 6],
  //         },
  //         {
  //           x: "Team C",
  //           y: [5, 8],
  //         },
  //         {
  //           x: "Team D",
  //           y: [3, 11],
  //         },
  //       ],
  //     },
  //     // {
  //     //   data: [
  //     //     {
  //     //       x: "Team A",
  //     //       y: [2, 6],
  //     //     },
  //     //     {
  //     //       x: "Team B",
  //     //       y: [1, 3],
  //     //     },
  //     //     {
  //     //       x: "Team C",
  //     //       y: [7, 8],
  //     //     },
  //     //     {
  //     //       x: "Team D",
  //     //       y: [5, 9],
  //     //     },
  //     //   ],
  //     // },
  //   ],
  //   options: {
  //     chart: {
  //       type: "rangeBar",
  //       height: 350,
  //     },
  //     plotOptions: {
  //       bar: {
  //         horizontal: false,
  //       },
  //     },
  //     dataLabels: {
  //       enabled: true,
  //     },
  //   },
  // };

  return (
    <div id="chart">
      <Chart
        options={options}
        series={MEASUREMENT_RANGE_DATA}
        type="rangeBar"
        width="95%"
        height={300}
      />{" "}
    </div>
  );
};
