'use client'

// React Imports
import React from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'

// Styled TextField Component
const TextFieldStyled = styled(TextField)<TextFieldProps>(({ theme }) => ({
  '& .MuiInputLabel-root': {
    transform: 'none',
    width: 'fit-content',
    maxWidth: '100%',
    lineHeight: 1.153,
    position: 'relative',
    fontSize: theme.typography.body2.fontSize,
    marginBottom: theme.spacing(1),
    color: 'var(--mui-palette-text-primary)',
    '&:not(.Mui-error).MuiFormLabel-colorPrimary.Mui-focused': {
      color: 'var(--mui-palette-primary-main) !important',
    },
    '&.Mui-disabled': {
      color: 'var(--mui-palette-text-disabled)',
    },
    '&.Mui-error': {
      color: 'var(--mui-palette-error-main)',
    },
  },
  '& .MuiInputBase-root': {
    backgroundColor: 'transparent !important',
    border: `1px solid var(--mui-palette-customColors-inputBorder)`,
    '&:not(.Mui-focused):not(.Mui-disabled):not(.Mui-error):hover': {
      borderColor: 'var(--mui-palette-action-active)',
    },
    '&:before, &:after': {
      display: 'none',
    },
    '&.MuiInputBase-sizeSmall': {
      borderRadius: 'var(--mui-shape-borderRadius)',
    },
    '&.Mui-error': {
      borderColor: 'var(--mui-palette-error-main)',
    },
    '&.Mui-focused': {
      borderWidth: 2,
      '& .MuiInputBase-input:not(.MuiInputBase-readOnly):not([readonly])::placeholder': {
        transform: 'translateX(4px)',
      },
      '&:not(.Mui-error).MuiInputBase-colorPrimary': {
        borderColor: 'var(--mui-palette-primary-main)',
        boxShadow: 'var(--mui-customShadows-primary-sm)',
      },
    },
    '&.Mui-disabled': {
      backgroundColor: 'var(--mui-palette-action-hover) !important',
    },
  },
}))

// ✅ Function Component tanpa forwardRef
const CustomTextField: React.FC<TextFieldProps> = ({ size = 'small', InputLabelProps, ...rest }) => {
  return (
    <TextFieldStyled
      size={size}
      {...rest}
      variant="filled"
      InputLabelProps={{ ...InputLabelProps, shrink: true }}
    />
  )
}

export default CustomTextField
