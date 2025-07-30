'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  CircularProgress,
  Box,
  Typography,
  Skeleton
} from '@mui/material'
import { FixedSizeList as List } from 'react-window'
import type { AttendanceRowType } from '@/types/attendanceRowTypes'

interface VirtualizedTableProps {
  data: AttendanceRowType[]
  columns: Array<{
    key: keyof AttendanceRowType
    label: string
    width: number
    render?: (value: any, row: AttendanceRowType) => React.ReactNode
  }>
  height?: number
  itemHeight?: number
  loading?: boolean
  onLoadMore?: () => void
  hasNextPage?: boolean
  loadingMore?: boolean
}

interface RowProps {
  index: number
  style: React.CSSProperties
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  columns,
  height = 600,
  itemHeight = 60,
  loading = false,
  onLoadMore,
  hasNextPage = false,
  loadingMore = false
}) => {
  const [visibleStartIndex, setVisibleStartIndex] = useState(0)
  const [visibleStopIndex, setVisibleStopIndex] = useState(0)
  const listRef = useRef<List>(null)
  const loadingRef = useRef(false)

  // Calculate total width for horizontal scrolling
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), [columns]
  )

  // Handle infinite scroll
  const handleItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }: any) => {
    setVisibleStartIndex(visibleStartIndex)
    setVisibleStopIndex(visibleStopIndex)

    // Load more when we're near the end
    if (
      hasNextPage &&
      !loadingMore &&
      !loadingRef.current &&
      onLoadMore &&
      visibleStopIndex >= data.length - 5
    ) {
      loadingRef.current = true
      onLoadMore()
      setTimeout(() => {
        loadingRef.current = false
      }, 1000)
    }
  }, [data.length, hasNextPage, loadingMore, onLoadMore])

  // Row renderer for react-window
  const Row = useCallback(({ index, style }: RowProps) => {
    // Show loading skeleton for items not yet loaded
    if (index >= data.length) {
      return (
        <div style={style}>
          <Box display="flex" alignItems="center" px={2} py={1}>
            {columns.map((column, colIndex) => (
              <Box key={colIndex} width={column.width} mr={1}>
                <Skeleton variant="text" height={20} />
              </Box>
            ))}
          </Box>
        </div>
      )
    }

    const row = data[index]
    
    return (
      <div style={style}>
        <Box 
          display="flex" 
          alignItems="center" 
          px={2} 
          py={1}
          borderBottom="1px solid #e0e0e0"
          sx={{ 
            '&:hover': { 
              backgroundColor: 'rgba(0, 0, 0, 0.04)' 
            }
          }}
        >
          {columns.map((column, colIndex) => (
            <Box 
              key={colIndex} 
              width={column.width} 
              mr={1}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {column.render 
                ? column.render(row[column.key], row)
                : String(row[column.key] || '-')
              }
            </Box>
          ))}
        </Box>
      </div>
    )
  }, [data, columns])

  // Loading state
  if (loading && data.length === 0) {
    return (
      <Paper>
        <Box display="flex" justifyContent="center" alignItems="center" height={height}>
          <CircularProgress />
        </Box>
      </Paper>
    )
  }

  return (
    <Paper>
      {/* Table Header */}
      <Box 
        display="flex" 
        alignItems="center" 
        px={2} 
        py={2}
        borderBottom="2px solid #e0e0e0"
        bgcolor="grey.50"
        fontWeight="bold"
      >
        {columns.map((column, index) => (
          <Box 
            key={index} 
            width={column.width} 
            mr={1}
            fontWeight="600"
          >
            <Typography variant="subtitle2" fontWeight="600">
              {column.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Virtual List */}
      <Box width={totalWidth} overflow="auto">
        <List
          ref={listRef}
          height={height}
          itemCount={data.length + (hasNextPage ? 5 : 0)} // Add extra items for loading
          itemSize={itemHeight}
          onItemsRendered={handleItemsRendered}
          width="100%"
        >
          {Row}
        </List>
      </Box>

      {/* Loading More Indicator */}
      {loadingMore && (
        <Box display="flex" justifyContent="center" alignItems="center" py={2}>
          <CircularProgress size={24} />
          <Typography variant="body2" ml={1}>
            Loading more...
          </Typography>
        </Box>
      )}

      {/* Data Info */}
      <Box 
        display="flex" 
        justifyContent="between" 
        alignItems="center" 
        px={2} 
        py={1}
        bgcolor="grey.50"
        borderTop="1px solid #e0e0e0"
      >
        <Typography variant="caption" color="text.secondary">
          Showing {Math.min(visibleStopIndex + 1, data.length)} of {data.length} items
          {hasNextPage && ' (Loading more available)'}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Rows {visibleStartIndex + 1}-{Math.min(visibleStopIndex + 1, data.length)}
        </Typography>
      </Box>
    </Paper>
  )
}

export default VirtualizedTable
