// React Imports
import { cloneElement, createElement, forwardRef } from 'react'
import type { ForwardRefRenderFunction } from 'react'

// Third-party Imports
import classnames from 'classnames'
import { css } from '@emotion/react'

// Type Imports
import type { ChildrenType, MenuButtonProps } from '../../types'

// Component Imports
import { RouterLink } from '../RouterLink'

// Util Imports
import { menuClasses } from '../../utils/menuClasses'

type MenuButtonStylesProps = Partial<ChildrenType> & {
  level: number
  active?: boolean
  disabled?: boolean
  isCollapsed?: boolean
  isPopoutWhenCollapsed?: boolean
}

export const menuButtonStyles = (props: MenuButtonStylesProps) => {
  // Props
  const { level, disabled, children, isCollapsed, isPopoutWhenCollapsed } = props

  return css({
    display: 'flex',
    alignItems: 'center',
    minBlockSize: '30px',
    textDecoration: 'none',
    color: 'inherit',
    boxSizing: 'border-box',
    cursor: 'pointer',
    paddingInlineEnd: '20px',
    paddingInlineStart: `${level === 0 ? 20 : (isPopoutWhenCollapsed && isCollapsed ? level : level + 1) * 20}px`,

    '&:hover, &[aria-expanded="true"]': {
      backgroundColor: '#f3f3f3'
    },

    '&:focus-visible': {
      outline: 'none',
      backgroundColor: '#f3f3f3'
    },

    ...(disabled && {
      pointerEvents: 'none',
      cursor: 'default',
      color: '#adadad'
    }),

    // All the active styles are applied to the button including menu items or submenu
    [`&.${menuClasses.active}`]: {
      ...(!children && { color: 'white' }),
      backgroundColor: children ? '#f3f3f3' : '#765feb'
    }
  })
}

const MenuButton: ForwardRefRenderFunction<HTMLAnchorElement, MenuButtonProps> = (
  { className, component, children, ...rest },
  ref
) => {
  if (component) {
    // If component is a string, create a new element of that type
    if (typeof component === 'string') {
      return createElement(
        component,
        {
          className: classnames(className),
          ...rest,
          ref
        },
        children
      )
    } else {
      // Otherwise, clone the element
      const { className: classNameProp, ...props } = component.props

      return cloneElement(
        component,
        {
          className: classnames(className, classNameProp),
          ...rest,
          ...props,
          ref
        },
        children
      )
    }
  } else {
    // If there is no component but href is defined, render RouterLink
    if (rest.href) {
      // Extract onClick to ensure it's properly handled
      const { onClick, ...linkProps } = rest
      return (
        <RouterLink 
          ref={ref} 
          className={className} 
          href={rest.href} 
          onClick={(e) => {
            // Call the original onClick if it exists
            onClick?.(e)
            // Prevent default only if href is '#' or empty
            if (rest.href === '#' || rest.href === '') {
              e.preventDefault()
            }
          }}
          {...linkProps}
        >
          {children}
        </RouterLink>
      )
    } else {
      // Only pass props that are safe for button elements
      const {
        onClick,
        onMouseDown,
        onMouseUp,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
        onKeyDown,
        onKeyUp,
        onKeyPress,
        title,
        id,
        'aria-label': ariaLabel,
        'aria-expanded': ariaExpanded,
        'aria-controls': ariaControls,
        'aria-haspopup': ariaHaspopup,
        tabIndex,
        style,
        'data-testid': dataTestId
      } = rest as any
      
      const buttonProps = {
        onClick,
        onMouseDown,
        onMouseUp,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
        onKeyDown,
        onKeyUp,
        onKeyPress,
        title,
        id,
        'aria-label': ariaLabel,
        'aria-expanded': ariaExpanded,
        'aria-controls': ariaControls,
        'aria-haspopup': ariaHaspopup,
        tabIndex,
        style,
        'data-testid': dataTestId
      }
      
      return (
        <button 
          ref={ref as any} 
          className={className} 
          type="button"
          {...buttonProps}
        >
          {children}
        </button>
      )
    }
  }
}

export default forwardRef(MenuButton)
