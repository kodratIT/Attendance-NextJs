'use client';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import RoleCards from './RoleCards';

// Interface untuk role
interface RoleRowType {
  id: string;
  name: string;
  permissions: string[];
}

interface Role {
  success: boolean;
  data: RoleRowType[];
}

// Props untuk komponen Roles
interface RolesProps {
  roleData?: Role;
}

const Roles = ({ roleData }: RolesProps) => {
  return (
    <Grid container spacing={6}>
      {/* Section: Roles List */}
      <Grid item xs={12}>
        <Typography variant="h4" className="mbe-1">Roles List</Typography>
        <Typography>
          A role provides access to predefined menus and features. Depending on the assigned role, an administrator can
          access what they need.
        </Typography>
      </Grid>

      {/* Role Cards Section */}
      <Grid item xs={12}>
        <RoleCards roleData={roleData} />
      </Grid>
    </Grid>
  );
};

export default Roles;
