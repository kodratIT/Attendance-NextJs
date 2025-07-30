'use client'

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Autocomplete,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Collapse
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { id } from 'date-fns/locale';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';
import type { AreaType } from '@/types/areaTypes';

interface AdvancedFilterProps {
  attendanceData: AttendanceRowType[];
  areaData: AreaType[];
  onFilterChange: (filteredData: AttendanceRowType[]) => void;
  onExport?: (data: AttendanceRowType[], type: 'csv' | 'excel') => void;
}

interface FilterState {
  searchText: string;
  selectedAreas: string[];
  selectedStatuses: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sortBy: 'name' | 'time' | 'status';
  sortOrder: 'asc' | 'desc';
}

const statusOptions = [
  { value: 'present', label: 'Hadir', color: '#4caf50' },
  { value: 'late', label: 'Terlambat', color: '#ff9800' },
  { value: 'absent', label: 'Tidak Hadir', color: '#f44336' }
];

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  attendanceData,
  areaData,
  onFilterChange,
  onExport
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    selectedAreas: [],
    selectedStatuses: [],
    dateRange: { start: null, end: null },
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const areaOptions = areaData.map(area => area.name);

  const applyFilters = useCallback(() => {
    let filtered = [...attendanceData];

    // Text search
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.userId.toLowerCase().includes(searchLower) ||
        item.areas.toLowerCase().includes(searchLower)
      );
    }

    // Area filter
    if (filters.selectedAreas.length > 0) {
      filtered = filtered.filter(item => 
        filters.selectedAreas.includes(item.areas)
      );
    }

    // Status filter
    if (filters.selectedStatuses.length > 0) {
      filtered = filtered.filter(item => 
        filters.selectedStatuses.includes(item.status.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= filters.dateRange.start!;
      });
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate <= filters.dateRange.end!;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'time':
          aValue = a.checkIn.time;
          bValue = b.checkIn.time;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    onFilterChange(filtered);
  }, [filters, attendanceData, onFilterChange]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchText: '',
      selectedAreas: [],
      selectedStatuses: [],
      dateRange: { start: null, end: null },
      sortBy: 'name',
      sortOrder: 'asc'
    });
    onFilterChange(attendanceData);
  };

  const handleExport = (type: 'csv' | 'excel') => {
    applyFilters();
    onExport?.(attendanceData, type);  // Will be filtered data
  };

  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const hasActiveFilters = filters.searchText || 
    filters.selectedAreas.length > 0 || 
    filters.selectedStatuses.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end;

  return (
    <Card>
      <CardHeader
        title="Filter & Pencarian Lanjutan"
        action={
          <Box display="flex" gap={1}>
            <Tooltip title="Bersihkan Filter">
              <IconButton 
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
                size="small"
              >
                <i className="tabler-filter-off" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isExpanded ? "Tutup Filter" : "Buka Filter"}>
              <IconButton 
                onClick={() => setIsExpanded(!isExpanded)}
                size="small"
              >
                <i className={`tabler-chevron-${isExpanded ? 'up' : 'down'}`} />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      
      <CardContent sx={{ pt: 0 }}>
        {/* Search Bar - Always Visible */}
        <TextField
          fullWidth
          placeholder="Cari berdasarkan nama, ID karyawan, atau area..."
          value={filters.searchText}
          onChange={(e) => handleFilterChange('searchText', e.target.value)}
          InputProps={{
            startAdornment: <i className="tabler-search" style={{ marginRight: 8, color: '#666' }} />,
          }}
          sx={{ mb: 2 }}
        />

        <Collapse in={isExpanded}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Area Filter */}
            <Autocomplete
              multiple
              options={areaOptions}
              value={filters.selectedAreas}
              onChange={(_, newValue) => handleFilterChange('selectedAreas', newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter berdasarkan Area"
                  placeholder="Pilih area..."
                />
              )}
            />

            {/* Status Filter */}
            <Autocomplete
              multiple
              options={statusOptions}
              getOptionLabel={(option) => option.label}
              value={statusOptions.filter(opt => filters.selectedStatuses.includes(opt.value))}
              onChange={(_, newValue) => 
                handleFilterChange('selectedStatuses', newValue.map(v => v.value))
              }
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.label}
                    style={{ borderColor: option.color, color: option.color }}
                    {...getTagProps({ index })}
                    key={option.value}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter berdasarkan Status"
                  placeholder="Pilih status..."
                />
              )}
            />

            {/* Date Range */}
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
              <Box display="flex" gap={2}>
                <DatePicker
                  label="Tanggal Mulai"
                  value={filters.dateRange.start}
                  onChange={(date) => handleFilterChange('dateRange', { 
                    ...filters.dateRange, 
                    start: date 
                  })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="Tanggal Akhir"
                  value={filters.dateRange.end}
                  onChange={(date) => handleFilterChange('dateRange', { 
                    ...filters.dateRange, 
                    end: date 
                  })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
            </LocalizationProvider>

            <Divider />

            {/* Sorting Options */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Urutkan berdasarkan:
              </Typography>
              <Box display="flex" gap={2}>
                <FormControl>
                  <RadioGroup
                    row
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <FormControlLabel value="name" control={<Radio size="small" />} label="Nama" />
                    <FormControlLabel value="time" control={<Radio size="small" />} label="Waktu" />
                    <FormControlLabel value="status" control={<Radio size="small" />} label="Status" />
                  </RadioGroup>
                </FormControl>
                <FormControl>
                  <RadioGroup
                    row
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  >
                    <FormControlLabel value="asc" control={<Radio size="small" />} label="A-Z" />
                    <FormControlLabel value="desc" control={<Radio size="small" />} label="Z-A" />
                  </RadioGroup>
                </FormControl>
              </Box>
            </Box>

            {/* Export Options */}
            {onExport && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Ekspor Data:
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<i className="tabler-file-spreadsheet" />}
                      onClick={() => handleExport('csv')}
                      size="small"
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<i className="tabler-file-type-xlsx" />}
                      onClick={() => handleExport('excel')}
                      size="small"
                    >
                      Excel
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Collapse>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Filter Aktif:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {filters.searchText && (
                <Chip 
                  label={`Pencarian: "${filters.searchText}"`} 
                  size="small" 
                  onDelete={() => handleFilterChange('searchText', '')}
                />
              )}
              {filters.selectedAreas.map(area => (
                <Chip
                  key={area}
                  label={`Area: ${area}`}
                  size="small"
                  onDelete={() => handleFilterChange('selectedAreas', 
                    filters.selectedAreas.filter(a => a !== area)
                  )}
                />
              ))}
              {filters.selectedStatuses.map(status => {
                const statusOption = statusOptions.find(s => s.value === status);
                return (
                  <Chip
                    key={status}
                    label={`Status: ${statusOption?.label}`}
                    size="small"
                    style={{ borderColor: statusOption?.color }}
                    variant="outlined"
                    onDelete={() => handleFilterChange('selectedStatuses', 
                      filters.selectedStatuses.filter(s => s !== status)
                    )}
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedFilter;
