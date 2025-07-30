'use client'

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Collapse,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
// Using tabler icon instead of MUI icons
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';

interface DrillDownProps {
  row: AttendanceRowType;
}

const DrillDown: React.FC<DrillDownProps> = ({ row }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Box mb={2}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">
              {row.name} - Details
            </Typography>
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
            >
              <i className={expanded ? "tabler-chevron-up" : "tabler-chevron-down"} />
            </IconButton>
          </Box>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CardContent>
              <Typography paragraph>
                Check-in Time: {row.checkIn.time || 'Not Available'}
              </Typography>
              <Typography paragraph>
                Check-out Time: {row.checkOut.time || 'Not Available'}
              </Typography>
              <Typography paragraph>Status: {row.status}</Typography>
              <Typography paragraph>Late By: {row.lateBy} minutes</Typography>
              <Typography paragraph>Departments: {row.shifts}</Typography>
            </CardContent>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DrillDown;

