// React Imports
import { useContext } from 'react'

// Context Imports
import { SettingsContext } from '@core/contexts/settingsContext'

export const useSettings = () => {
  // Hooks
  const context = useContext(SettingsContext)

  // During static generation, provide default values
  if (!context) {
    // Return default values for static generation
    return {
      settings: {
        mode: 'light' as const,
        skin: 'default' as const,
        semiDark: false,
        layout: 'vertical' as const,
        navbarContentWidth: 'compact' as const,
        contentWidth: 'compact' as const,
        footerContentWidth: 'compact' as const,
        primaryColor: '#7C4DFF'
      },
      updateSettings: () => {},
      isSettingsChanged: false,
      resetSettings: () => {},
      updatePageSettings: () => () => {}
    }
  }

  return context
}
