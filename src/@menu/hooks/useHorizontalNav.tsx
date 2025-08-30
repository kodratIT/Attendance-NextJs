// React Imports
import { useContext } from 'react'

// Context Imports
import HorizontalNavContext from '../contexts/horizontalNavContext'

const useHorizontalNav = () => {
  // Hooks
  const context = useContext(HorizontalNavContext)

  // During static generation, provide default values
  if (context === null || context === undefined) {
    // Return default values for static generation
    return {
      isBreakpointReached: false,
      updateIsBreakpointReached: () => {}
    }
  }

  return context
}

export default useHorizontalNav
