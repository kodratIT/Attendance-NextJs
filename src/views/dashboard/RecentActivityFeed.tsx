'use client'

import { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'

interface Activity {
  id: string
  type: 'check-in' | 'check-out' | 'late' | 'absent' | 'manual' | 'report'
  user: string
  message: string
  timestamp: Date
  location?: string
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'check-in':
      return 'tabler-login'
    case 'check-out':
      return 'tabler-logout'
    case 'late':
      return 'tabler-clock-exclamation'
    case 'absent':
      return 'tabler-user-x'
    case 'manual':
      return 'tabler-edit'
    case 'report':
      return 'tabler-file-report'
    default:
      return 'tabler-bell'
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'check-in':
      return 'success'
    case 'check-out':
      return 'info'
    case 'late':
      return 'warning'
    case 'absent':
      return 'error'
    case 'manual':
      return 'secondary'
    case 'report':
      return 'primary'
    default:
      return 'default'
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

// Mock data - in real app, this would come from an API
const generateMockActivities = (): Activity[] => {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'check-in',
      user: 'John Doe',
      message: 'Checked in at Jakarta Office',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      location: 'Jakarta Office'
    },
    {
      id: '2', 
      type: 'late',
      user: 'Jane Smith',
      message: 'Late arrival - 15 minutes',
      timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
      location: 'Bandung Office'
    },
    {
      id: '3',
      type: 'check-out',
      user: 'Mike Johnson',
      message: 'Checked out from Surabaya Office',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      location: 'Surabaya Office'
    },
    {
      id: '4',
      type: 'manual',
      user: 'Admin',
      message: 'Manual attendance entry for Sarah Wilson',
      timestamp: new Date(Date.now() - 67 * 60 * 1000), // 1 hour 7 minutes ago
    },
    {
      id: '5',
      type: 'report',
      user: 'HR Manager',
      message: 'Generated monthly attendance report',
      timestamp: new Date(Date.now() - 95 * 60 * 1000), // 1 hour 35 minutes ago
    }
  ]
  
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

const RecentActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    // Simulate loading activities
    setActivities(generateMockActivities())
    
    // Update activities every 30 seconds to simulate real-time feed
    const interval = setInterval(() => {
      setActivities(generateMockActivities())
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Recent Activity"
        subheader="Live feed of attendance activities"
        action={
          <Chip 
            label="Live" 
            color="success" 
            size="small"
            icon={<i className="tabler-circle-filled" style={{ fontSize: '0.5rem' }} />}
          />
        }
      />
      <CardContent sx={{ flexGrow: 1, overflow: 'auto', pt: 0 }}>
        <List disablePadding>
          {activities.map((activity, index) => (
            <Box key={activity.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${getActivityColor(activity.type)}.light`,
                      color: `${getActivityColor(activity.type)}.main`,
                      width: 40,
                      height: 40
                    }}
                  >
                    <i className={getActivityIcon(activity.type)} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight="medium">
                        {activity.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.primary">
                        {activity.message}
                      </Typography>
                      {activity.location && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          <i className="tabler-map-pin" style={{ fontSize: '0.75rem', marginRight: '4px' }} />
                          {activity.location}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider variant="inset" component="li" />}
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}

export default RecentActivityFeed
