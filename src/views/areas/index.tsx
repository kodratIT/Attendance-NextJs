'use client';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import AreaCards from './AreaCards';
import { AreaType } from '@/types/areaTypes';
// Next Imports
import { useRouter } from 'next/navigation'

interface Area {
  success: boolean;
  data: AreaType[];
}

// Props untuk komponen Areas
interface AreasProps {
  areaData?: Area;
}

const Areas = ({ areaData }: AreasProps) => {

const router = useRouter()
  return (
    <Grid container spacing={6}>
      {/* Section: Areas List */}
      <Grid item xs={12}>
        <Typography variant="h4" className="mbe-1">Areas List</Typography>
        <Typography>
          An area provides access to predefined locations. Depending on the assigned area, an administrator can
          manage what they need.
        </Typography>
      </Grid>
      {/* Area Cards Section */}
      <Grid item xs={12}>
        <AreaCards areaData={areaData} />
      </Grid>
    </Grid>
  );
};

export default Areas;