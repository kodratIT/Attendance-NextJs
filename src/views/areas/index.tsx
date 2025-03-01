'use client';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import AreaCards from './AreaCards';
import { AreaType } from '@/types/areaTypes';
// Next Imports
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie';
import { useState,useEffect } from 'react'
import {jwtDecode} from 'jwt-decode';


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

useEffect(() => {
  const token = Cookies.get('token'); // Get the token from cookies
  if (token) {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const currentTime = Date.now() / 1000; // Current time in seconds
      if (decoded.exp > currentTime) {
        // router.push('/home'); // Redirect to home if token is valid
      } else {
        console.log('Token is expired');
        router.push('/login'); // Redirect to login if token is expired
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login'); // Redirect to login on decoding error
    }
  } else {
    router.push('/login'); // Redirect to login if no token
  }
}, [router]);

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