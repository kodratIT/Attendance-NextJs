'use client'

import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { useRouter } from 'next/navigation'

// Icons (using Tabler icons as per the existing pattern)
const iconStyle = { fontSize: '1.5rem' }

interface QuickAction {
  title: string
  description: string
  icon: string
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  route: string
  shortcut?: string
}

const quickActions: QuickAction[] = [
  {
    title: 'Add Employee',
    description: 'Register new employee',
    icon: 'tabler-user-plus',
    color: 'primary',
    route: '/users',
    shortcut: 'Ctrl+N'
  },
  {
    title: 'Manual Attendance',
    description: 'Record manual attendance',
    icon: 'tabler-clock-plus',
    color: 'success',
    route: '/attendance',
    shortcut: 'Ctrl+A'
  },
  {
    title: 'Generate Report',
    description: 'Create attendance report',
    icon: 'tabler-file-report',
    color: 'info',
    route: '/report',
    shortcut: 'Ctrl+R'
  },
  {
    title: 'Manage Areas',
    description: 'Configure work areas',
    icon: 'tabler-map-pin',
    color: 'warning',
    route: '/areas',
    shortcut: 'Ctrl+M'
  },
  {
    title: 'View Shifts',
    description: 'Manage work shifts',
    icon: 'tabler-calendar-time',
    color: 'secondary',
    route: '/shifts'
  },
  {
    title: 'Export Data',
    description: 'Download attendance data',
    icon: 'tabler-download',
    color: 'error',  
    route: '/report',
    shortcut: 'Ctrl+E'
  }
]

const QuickActionsPanel = () => {
  const router = useRouter()
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const handleActionClick = (route: string) => {
    router.push(route)
  }

  return (
    <Card>
      <CardHeader
        title="Quick Actions"
        subheader="Frequently used shortcuts"
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {action.title}
                    </Typography>
                    <Typography variant="caption" color="inherit">
                      {action.description}
                    </Typography>
                    {action.shortcut && (
                      <Typography variant="caption" color="inherit" display="block">
                        <code>{action.shortcut}</code>
                      </Typography>
                    )}
                  </Box>
                }
                arrow
                placement="top"
              >
                <Button
                  variant={hoveredAction === action.title ? 'contained' : 'outlined'}
                  color={action.color}
                  fullWidth
                  sx={{
                    height: '80px',
                    flexDirection: 'column',
                    gap: 1,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme => theme.shadows[4]
                    }
                  }}
                  onClick={() => handleActionClick(action.route)}
                  onMouseEnter={() => setHoveredAction(action.title)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  <i className={action.icon} style={iconStyle} />
                  <Typography variant="caption" textAlign="center" noWrap>
                    {action.title}
                  </Typography>
                </Button>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default QuickActionsPanel
