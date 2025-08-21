import { Grid, Card, CardContent, Typography } from '@mui/material'

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          backgroundColor: color, 
          borderRadius: '50%', 
          padding: '0.75rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'white' 
        }}>
          {icon}
        </div>
        <div>
          <Typography variant="h6">{value}</Typography>
          <Typography color="textSecondary">{title}</Typography>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StatsCard;
