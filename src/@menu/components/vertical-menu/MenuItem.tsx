'use client'

// React Imports
import { forwardRef, useEffect, useState, useMemo } from 'react'
import type { AnchorHTMLAttributes, ForwardRefRenderFunction, ReactElement, ReactNode } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'
import { useUpdateEffect } from 'react-use'
import type { CSSObject } from '@emotion/styled'

// Type Imports
import type { ChildrenType, MenuItemElement, MenuItemExactMatchUrlProps, RootStylesType } from '../../types'

// Component Imports
import MenuButton from './MenuButton'

// Hook Imports
import useVerticalNav from '../../hooks/useVerticalNav'
import useVerticalMenu from '../../hooks/useVerticalMenu'

// Util Imports
import { renderMenuIcon } from '../../utils/menuUtils'
import { menuClasses } from '../../utils/menuClasses'

// Styled Component Imports
import StyledMenuLabel from '../../styles/StyledMenuLabel'
import StyledMenuPrefix from '../../styles/StyledMenuPrefix'
import StyledMenuSuffix from '../../styles/StyledMenuSuffix'
import StyledVerticalMenuItem from '../../styles/vertical/StyledVerticalMenuItem'

export type MenuItemProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'prefix'> &
  RootStylesType &
  Partial<ChildrenType> &
  MenuItemExactMatchUrlProps & {
    icon?: ReactElement
    prefix?: ReactNode
    suffix?: ReactNode
    disabled?: boolean
    target?: string
    rel?: string
    component?: string | ReactElement
    onActiveChange?: (active: boolean) => void

    /**
     * @ignore
     */
    level?: number
  }

const MenuItem: ForwardRefRenderFunction<HTMLLIElement, MenuItemProps> = (props, ref) => {
  // Props
  const {
    children,
    icon,
    className,
    prefix,
    suffix,
    level = 0,
    disabled = false,
    exactMatch = true,
    activeUrl,
    component,
    onActiveChange,
    rootStyles,
    ...rest
  } = props

  // States
  const [active, setActive] = useState(false)

  // Hooks
  const pathname = usePathname()
  const { menuItemStyles, renderExpandedMenuItemIcon, textTruncate } = useVerticalMenu()

  const { isCollapsed, isHovered, isPopoutWhenCollapsed, toggleVerticalNav, isToggled, isBreakpointReached } =
    useVerticalNav()

  // Get the styles for the specified element.
  const getMenuItemStyles = (element: MenuItemElement): CSSObject | undefined => {
    // If the menuItemStyles prop is provided, get the styles for the specified element.
    if (menuItemStyles) {
      // Define the parameters that are passed to the style functions.
      const params = { level, disabled, active, isSubmenu: false }

      // Get the style function for the specified element.
      const styleFunction = menuItemStyles[element]

      if (styleFunction) {
        // If the style function is a function, call it and return the result.
        // Otherwise, return the style function itself.
        return typeof styleFunction === 'function' ? styleFunction(params) : styleFunction
      }
    }
  }

  // Handle the click event.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only close navigation on mobile if we're navigating to a page
    if (isToggled && rest.href && rest.href !== '#') {
      toggleVerticalNav()
    }
  }

  // Extract href in a stable way
  const href = useMemo(() => {
    if (rest.href) {
      return rest.href
    }
    if (component && typeof component !== 'string' && component.props?.href) {
      return component.props.href
    }
    return undefined
  }, [rest.href])

  // Change active state when the url changes
  useEffect(() => {
    if (href) {
      // Check if the current url matches any of the children urls
      const shouldBeActive = exactMatch 
        ? pathname === href 
        : activeUrl 
          ? pathname.includes(activeUrl) 
          : false
      
      // Only update if the state actually changes
      setActive(prevActive => {
        if (prevActive !== shouldBeActive) {
          return shouldBeActive
        }
        return prevActive
      })
    } else {
      setActive(false)
    }
  }, [pathname, href, exactMatch, activeUrl])

  // Call the onActiveChange callback when the active state changes.
  useUpdateEffect(() => {
    onActiveChange?.(active)
  }, [active])

  return (
    <StyledVerticalMenuItem
      ref={ref}
      className={classnames(
        menuClasses.menuItemRoot,
        { [menuClasses.disabled]: disabled },
        { [menuClasses.active]: active },
        className
      )}
      level={level}
      isCollapsed={isCollapsed}
      isPopoutWhenCollapsed={isPopoutWhenCollapsed}
      disabled={disabled}
      buttonStyles={getMenuItemStyles('button')}
      menuItemStyles={getMenuItemStyles('root')}
      rootStyles={rootStyles}
    >
      <MenuButton
        className={classnames(menuClasses.button, { [menuClasses.active]: active })}
        component={component}
        tabIndex={disabled ? -1 : 0}
        {...rest}
        onClick={e => {
          handleClick(e)
          rest.onClick && rest.onClick(e)
        }}
      >
        {/* Menu Item Icon */}
        {renderMenuIcon({
          icon,
          level,
          active,
          disabled,
          renderExpandedMenuItemIcon,
          styles: getMenuItemStyles('icon'),
          isBreakpointReached
        })}

        {/* Menu Item Prefix */}
        {prefix && (
          <StyledMenuPrefix
            isHovered={isHovered}
            isCollapsed={isCollapsed}
            firstLevel={level === 0}
            className={menuClasses.prefix}
            rootStyles={getMenuItemStyles('prefix')}
          >
            {prefix}
          </StyledMenuPrefix>
        )}

        {/* Menu Item Label */}
        <StyledMenuLabel
          className={menuClasses.label}
          rootStyles={getMenuItemStyles('label')}
          textTruncate={textTruncate}
        >
          {children}
        </StyledMenuLabel>

        {/* Menu Item Suffix */}
        {suffix && (
          <StyledMenuSuffix
            isHovered={isHovered}
            isCollapsed={isCollapsed}
            firstLevel={level === 0}
            className={menuClasses.suffix}
            rootStyles={getMenuItemStyles('suffix')}
          >
            {suffix}
          </StyledMenuSuffix>
        )}
      </MenuButton>
    </StyledVerticalMenuItem>
  )
}

export default forwardRef(MenuItem)
