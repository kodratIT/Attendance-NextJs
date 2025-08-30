// React Imports
import { useContext } from 'react'

// Context Imports
import VerticalNavContext from '../contexts/verticalNavContext'

const useVerticalNav = () => {
  // Hooks
  const context = useContext(VerticalNavContext)

  // During static generation, provide default values
  if (context === null || context === undefined) {
    // Return default values for static generation
    return {
      width: 260,
      collapsedWidth: 80,
      isCollapsed: false,
      isHovered: false,
      isToggled: false,
      isScrollWithContent: false,
      isBreakpointReached: false,
      isPopoutWhenCollapsed: false,
      collapsing: false,
      expanding: false,
      transitionDuration: 300,
      updateVerticalNavState: () => {},
      collapseVerticalNav: () => {},
      hoverVerticalNav: () => {},
      toggleVerticalNav: () => {}
    }
  }

  return context
}

export default useVerticalNav
