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
      setSession(s)
      setLoading(false)
    }

    fetchSession()
  }, [])

  const roleName = session?.user?.role?.name
  const isAdmin = roleName === 'Admin'
  const isSuperAdmin = roleName === 'Super Admin'

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
            Beranda
          </MenuItem>
        )}

        {isSuperAdmin && (
          <MenuSection label='Manajemen Tindakan'>
            <MenuItem href='#' icon={<i className='tabler-stethoscope' />}>
              Tindakan Medis
            </MenuItem>
          </MenuSection>
        )}


        {isSuperAdmin && (
          <MenuSection label='Manajemen Absensi'>
            <MenuItem href='/attendance' icon={<i className='tabler-smart-home' />}>
              Presensi
            </MenuItem>
            <MenuItem href='/shifts' icon={<i className='tabler-calendar-time' />}>
              Jadwal Shift
            </MenuItem>
          </MenuSection>
        )}

        {isSuperAdmin && (
          <MenuSection label='Geolokasi'>
            <MenuItem href='/areas' icon={<i className='tabler-chart-area' />}>
              Wilayah
            </MenuItem>
            <MenuItem href='/locations' icon={<i className='tabler-map' />}>
              Lokasi
            </MenuItem>
          </MenuSection>
        )}

        {isSuperAdmin && (
          <MenuSection label='Laporan & Analisis'>
            <MenuItem href='/report' icon={<i className='tabler-report' />}>
              Laporan
            </MenuItem>
          </MenuSection>
        )}


        {isSuperAdmin && (
          <MenuSection label='Kontrol Akses'>
            <SubMenu label='Peran & Izin' icon={<i className='tabler-lock' />}>
              <MenuItem href='/roles'>Peran</MenuItem>
              <MenuItem href='/permissions'>Izin</MenuItem>
            </SubMenu>
            <MenuItem href='/users' icon={<i className='tabler-users' />}>
              Pengguna
            </MenuItem>
          </MenuSection>
        )}
 {isSuperAdmin && (
          <MenuSection label='Changelog'>
            <MenuItem href='/changelog' icon={<i className='tabler-report' />}>
              Changelog
            </MenuItem>
          </MenuSection>
        )}
         
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
