import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import { Grid } from "@aws-amplify/ui-react";
import { Paper } from "@mui/material";
import { minHeight } from "@mui/system";
import Chip from "@mui/material/Chip";

export default function AnalyticsCard({ title, value, change }) {
  const theme = useTheme();

  const StyledCard = styled(Paper)(() => ({
    minHeight: "unset",
  }));

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "40%",
        justifyContent: "space-between",
      }}
    >
      {/* <Grid
        container
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      > */}
      <CardContent>
        <Typography component="div" variant="subtitle1">
          {title}
        </Typography>
        <Typography variant="h6">{value}</Typography>
      </CardContent>
      <Chip label={change > 0 ? "+" + change + "%" : "-" + -change + "%"} />
      {/* </Grid> */}
    </Card>
  );
}
