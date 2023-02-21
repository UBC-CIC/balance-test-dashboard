import React, { PureComponent, useEffect } from "react";
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
} from "recharts";

export const ScoreChart = ({ data }) => {
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
        <XAxis dataKey="date" />
        <YAxis />
        {/* <Tooltip /> */}
        {/* <Legend /> */}
        <ReferenceLine y={85} label="OK" stroke="green" position="start" />
        <ReferenceLine y={60} label="Low" stroke="red" position="end" />
        <ReferenceLine y={40} label="Very Low" stroke="red" position="end" />

        <Line type="monotone" dataKey="score" stroke="black" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const SensorChart = ({ data }) => {
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
        <XAxis dataKey="timestamp" />
        <YAxis />
        {/* <Tooltip /> */}
        {/* <Legend /> */}

        <Line type="monotone" dataKey="measurement" stroke="black" />
      </LineChart>
    </ResponsiveContainer>
  );
};
