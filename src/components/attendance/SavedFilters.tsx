'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Alert
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

export interface SavedFilter {
  id: string
  name: string
  description?: string
  filters: {
    dateRange?: {
      startDate: Date | null
      endDate: Date | null
    }
    status?: string[]
    departments?: string[]
    employees?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  createdAt: Date
  updatedAt: Date
  isDefault?: boolean
}

interface SavedFiltersProps {
  onApplyFilter: (filter: SavedFilter['filters']) => void
  currentFilters: SavedFilter['filters']
  className?: string
}

const SavedFilters: React.FC<SavedFiltersProps> = ({
  onApplyFilter,
  currentFilters,
  className
}) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null)
  const [filterName, setFilterName] = useState('')
  const [filterDescription, setFilterDescription] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null)

  // Load saved filters from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('attendance-saved-filters')
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((filter: any) => ({
          ...filter,
          createdAt: new Date(filter.createdAt),
          updatedAt: new Date(filter.updatedAt),
          filters: {
            ...filter.filters,
            dateRange: filter.filters.dateRange ? {
              startDate: filter.filters.dateRange.startDate ? new Date(filter.filters.dateRange.startDate) : null,
              endDate: filter.filters.dateRange.endDate ? new Date(filter.filters.dateRange.endDate) : null
            } : undefined
          }
        }))
        setSavedFilters(parsed)
      } catch (error) {
        console.error('Error loading saved filters:', error)
      }
    }
  }, [])

  // Save filters to localStorage whenever savedFilters changes
  useEffect(() => {
    localStorage.setItem('attendance-saved-filters', JSON.stringify(savedFilters))
  }, [savedFilters])

  const handleSaveFilter = () => {
    if (!filterName.trim()) return

    const newFilter: SavedFilter = {
      id: editingFilter?.id || `filter-${Date.now()}`,
      name: filterName.trim(),
      description: filterDescription.trim() || undefined,
      filters: { ...currentFilters },
      createdAt: editingFilter?.createdAt || new Date(),
      updatedAt: new Date(),
      isDefault: editingFilter?.isDefault || false
    }

    if (editingFilter) {
      setSavedFilters(prev => prev.map(f => f.id === editingFilter.id ? newFilter : f))
    } else {
      setSavedFilters(prev => [...prev, newFilter])
    }

    handleCloseDialog()
  }

  const handleDeleteFilter = (filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId))
    setMenuAnchor(null)
  }

  const handleSetDefault = (filterId: string) => {
    setSavedFilters(prev => prev.map(f => ({
      ...f,
      isDefault: f.id === filterId
    })))
    setMenuAnchor(null)
  }

  const handleApplyFilter = (filter: SavedFilter) => {
    onApplyFilter(filter.filters)
    setSelectedFilterId(filter.id)
  }

  const handleOpenDialog = (filter?: SavedFilter) => {
    setEditingFilter(filter || null)
    setFilterName(filter?.name || '')
    setFilterDescription(filter?.description || '')
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingFilter(null)
    setFilterName('')
    setFilterDescription('')
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, filterId: string) => {
    setMenuAnchor(event.currentTarget)
    setSelectedFilterId(filterId)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedFilterId(null)
  }

  const getFilterSummary = (filters: SavedFilter['filters']) => {
    const parts = []
    
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
      const start = filters.dateRange.startDate?.toLocaleDateString() || '...'
      const end = filters.dateRange.endDate?.toLocaleDateString() || '...'
      parts.push(`Date: ${start} - ${end}`)
    }
    
    if (filters.status?.length) {
      parts.push(`Status: ${filters.status.join(', ')}`)
    }
    
    if (filters.departments?.length) {
      parts.push(`Dept: ${filters.departments.join(', ')}`)
    }
    
    if (filters.employees?.length) {
      parts.push(`Employees: ${filters.employees.length} selected`)
    }

    return parts.join(' | ') || 'No filters applied'
  }

  const defaultFilter = savedFilters.find(f => f.isDefault)

  return (
    <Card className={className}>
      <CardContent>
        <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h3">
            Saved Filters
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<i className="tabler-plus" />}
            onClick={() => handleOpenDialog()}
          >
            Save Current
          </Button>
        </Box>

        {defaultFilter && (
          <Box mb={2}>
            <Alert severity="info" variant="outlined">
              <Typography variant="body2" fontWeight="medium">
                Default Filter: {defaultFilter.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getFilterSummary(defaultFilter.filters)}
              </Typography>
            </Alert>
          </Box>
        )}

        <Box display="flex" flexWrap="wrap" gap={1}>
          {savedFilters.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.name}
              variant={selectedFilterId === filter.id ? "filled" : "outlined"}
              color={filter.isDefault ? "primary" : "default"}
              onClick={() => handleApplyFilter(filter)}
              onDelete={(e) => {
                e.stopPropagation()
                handleMenuOpen(e, filter.id)
              }}
              deleteIcon={<i className="tabler-dots-vertical" />}
              sx={{ 
                cursor: 'pointer',
                '& .MuiChip-deleteIcon': {
                  fontSize: '18px'
                }
              }}
            />
          ))}
        </Box>

        {savedFilters.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            No saved filters yet. Save your current filter settings to reuse them later.
          </Typography>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            const filter = savedFilters.find(f => f.id === selectedFilterId)
            if (filter) handleOpenDialog(filter)
            handleMenuClose()
          }}>
            <ListItemIcon>
              <i className="tabler-edit" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => {
            if (selectedFilterId) handleSetDefault(selectedFilterId)
          }}>
            <ListItemIcon>
              <i className="tabler-star" />
            </ListItemIcon>
            <ListItemText>Set as Default</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem 
            onClick={() => {
              if (selectedFilterId) handleDeleteFilter(selectedFilterId)
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <i className="tabler-trash" style={{ color: 'inherit' }} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Save/Edit Dialog */}
        <Dialog 
          open={isDialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingFilter ? 'Edit Filter' : 'Save Current Filter'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Filter Name"
              fullWidth
              variant="outlined"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={filterDescription}
              onChange={(e) => setFilterDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="subtitle2" gutterBottom>
              Current Filter Settings:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getFilterSummary(currentFilters)}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSaveFilter} 
              variant="contained"
              disabled={!filterName.trim()}
            >
              {editingFilter ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default SavedFilters
