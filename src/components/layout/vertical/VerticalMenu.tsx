'use client'

import { useEffect, useState } from 'react'
import { getSession } from 'next-auth/react'
import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import type { Session } from 'next-auth'
import type { getDictionary } from '@/utils/getDictionary'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

import { Menu, MenuItem, SubMenu, MenuSection } from '@menu/vertical-menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ dictionary, scrollMenu }: Props) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { isBreakpointReached } = useVerticalNav()
  const { transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      const s = await getSession()
      console.log('✅ Session fetched:', s)
      setSession(s)
      setLoading(false)
    }

    fetchSession()
  }, [])

  const roleName = session?.user?.role?.name
  const isAdmin = roleName === 'Admin'
  const isSuperAdmin = roleName === 'Super Admin'
  const isPegawai = roleName === 'Pegawai'
  const isDokter = roleName === 'Dokter'

  console.log('🔁 Render VerticalMenu - role:', roleName)
  console.log('🔐 isAdmin:', isAdmin)
  console.log('🛡️ isSuperAdmin:', isSuperAdmin)
  console.log('📱 isBreakpointReached:', isBreakpointReached)

  if (loading) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    )
  }

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => (
          <RenderExpandIcon open={open} transitionDuration={transitionDuration} />
        )}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        {(isAdmin || isSuperAdmin) && (
          <MenuItem href='/home' icon={<i className='tabler-dashboard' />}>
            Dashboard
          </MenuItem>
        )}

        {(isAdmin || isSuperAdmin) && (
          <MenuSection label='Attendance Management'>
            <MenuItem href='/attendance' icon={<i className='tabler-smart-home' />}>
              Attendance
            </MenuItem>
            {isSuperAdmin && (
              <MenuItem href='/shifts' icon={<i className='tabler-calendar-time' />}>
                Shifts
              </MenuItem>
            )}
          </MenuSection>
        )}

        {isSuperAdmin && (
          <MenuSection label='Geolocation'>
            <MenuItem href='/areas' icon={<i className='tabler-chart-area' />}>
              Areas
            </MenuItem>
            <MenuItem href='/locations' icon={<i className='tabler-map' />}>
              Locations
            </MenuItem>
          </MenuSection>
        )}

        {(isSuperAdmin) && (
          <MenuSection label='Reports & Analysis'>
            <MenuItem href='/report' icon={<i className='tabler-report' />}>
              Laporan
            </MenuItem>
          </MenuSection>
        )}

        {(isSuperAdmin) && (
          <MenuSection label='Access Control'>
            {isSuperAdmin && (
              <SubMenu label='Roles & Permissions' icon={<i className='tabler-lock' />}>
                <MenuItem href='/roles'>Roles</MenuItem>
                <MenuItem href='/permissions'>Permissions</MenuItem>
              </SubMenu>
            )}
            <MenuItem href='/users' icon={<i className='tabler-users' />}>
              Users
            </MenuItem>
          </MenuSection>
        )}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
  