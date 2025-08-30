import type { Theme } from '@mui/material/styles'
import type { MenuItemStyles } from '@menu/types'
import type { VerticalNavState } from '@menu/contexts/verticalNavContext'
import { menuClasses } from '@menu/utils/menuClasses'

import menuItemStyles from './menuItemStyles'

const customMenuItemStyles = (verticalNavOptions: VerticalNavState, theme: Theme): MenuItemStyles => {
  const baseStyles = menuItemStyles(verticalNavOptions, theme)
  
  return {
    ...baseStyles,
    root: ({ level, disabled, isSubmenu }) => ({
      ...(typeof baseStyles.root === 'function' ? baseStyles.root({ level, disabled, isSubmenu }) : baseStyles.root || {}),
      // Override untuk konsistensi warna
      [`&.${menuClasses.subMenuRoot}`]: {
        [`& > .${menuClasses.button}`]: {
          // Styling konsisten untuk SubMenu
          '&:hover': {
            backgroundColor: 'var(--mui-palette-action-hover)',
            color: 'inherit'
          },
          '&:focus-visible': {
            backgroundColor: 'var(--mui-palette-action-hover)',
            color: 'inherit'
          }
        },
        [`&.${menuClasses.open} > .${menuClasses.button}`]: {
          backgroundColor: 'var(--mui-palette-action-selected) !important',
          color: 'var(--mui-palette-text-primary) !important'
        },
        [`& > .${menuClasses.button}.${menuClasses.active}`]: {
          backgroundColor: 'var(--mui-palette-action-selected) !important',
          color: 'var(--mui-palette-text-primary) !important'
        }
      }
    }),
    button: ({ level, active, disabled, isSubmenu }) => ({
      ...(typeof baseStyles.button === 'function' ? baseStyles.button({ level, active, disabled, isSubmenu }) : baseStyles.button || {}),
      // Override untuk konsistensi hover dan active states
      ...(!active && {
        '&:hover, &:focus-visible': {
          backgroundColor: 'var(--mui-palette-action-hover)',
          color: 'var(--mui-palette-text-primary)'
        },
        '&[aria-expanded="true"]': {
          backgroundColor: 'var(--mui-palette-action-selected)',
          color: 'var(--mui-palette-text-primary)'
        }
      })
    }),
    icon: ({ level, disabled, isSubmenu }) => ({
      ...(typeof baseStyles.icon === 'function' ? baseStyles.icon({ level, disabled, isSubmenu }) : baseStyles.icon || {}),
      // Konsistensi warna icon
      color: level === 0 ? 'var(--mui-palette-text-primary)' : 'var(--mui-palette-text-secondary)',
      '&:hover': {
        color: 'inherit'
      }
    })
  }
}

export default customMenuItemStyles
