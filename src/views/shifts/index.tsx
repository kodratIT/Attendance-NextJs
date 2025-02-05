// app/shifts/index.tsx
'use client';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import ShiftCards from './ShiftCards';
import { ShiftType } from '@/types/shiftTypes';

interface Shift {
  success: boolean;
  data: ShiftType[];
}

interface ShiftsProps {
  shiftData?: Shift;
}

const Shifts = ({ shiftData }: ShiftsProps) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h4">Shifts List</Typography>
        <Typography variant="body1">
          A shift provides access to predefined working hours. Depending on the assigned shift, an administrator can manage what they need.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <ShiftCards shiftData={shiftData} />
      </Grid>
    </Grid>
  );
};

export default Shifts;