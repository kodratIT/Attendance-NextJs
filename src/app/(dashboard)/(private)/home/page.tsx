'use client'

import { useEffect, useState } from 'react'
import { getSession } from 'next-auth/react'
import type { AttendanceRowType } from '@/types/attendanceRowTypes'
import AttendanceHistory from '@views/dashboard/RealtimeTable'
import CircularProgress from '@mui/material/CircularProgress'
import axios from 'axios'

import Grid from '@mui/material/Grid'
import CardStatVertical from '@/components/card-statistics/Vertical'

const Loading = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <CircularProgress />
  </div>
)

const AttendancePage = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AttendanceRowType[]>([])
  const [employeeCount, setEmployeeCount] = useState<number>(0)
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [countLate, setCountLate] = useState(0)
  const [countPresent, setCountPresent] = useState(0)


  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await getSession()
        const role = session?.user?.role?.name
        const userAreaIds: string[] = Array.isArray(session?.user?.areas) ? session.user.areas : []

        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiUrl) throw new Error('❌ NEXT_PUBLIC_API_URL not set')

        // Format tanggal WIB (today)
        const now = new Date()
        now.setHours(now.getHours() + 7)
        const fromDate = now.toISOString().slice(0, 10)

        // Ambil data absensi
        const attendanceRes = await axios.get(`${apiUrl}/api/attendance?fromDate=${fromDate}&toDate=${fromDate}`, {
          headers: {
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          timeout: 10000,
        })

        let attendanceData: AttendanceRowType[] = attendanceRes.data || []



        if (role === 'Admin') {
          attendanceData = attendanceData.filter((row: AttendanceRowType) => {
            return typeof row?.areaId === 'string' && userAreaIds.includes(row.areaId)
          })
        }

        // Hitung present dan late
        let late = 0
        let present = 0

        attendanceData.forEach(item => {
          if (item.status === 'present') {
            present += 1
          } else if (item.status === 'late') {
            late += 1
          }
        })

        setCountLate(late)
        setCountPresent(present)

        setData(attendanceData)

        setSessionUser(session?.user || null) 

        // Ambil data user
        const usersRes = await axios.get(`${apiUrl}/api/users`)
        let users = usersRes.data || []

        if (role === 'Admin') {
          users = users.filter((user: any) =>
            Array.isArray(user.areas) &&
            user.areas.some((area: any) => userAreaIds.includes(area.id))
          )
        }

        setEmployeeCount(users.length)
      } catch (error: any) {
        console.error('❌ Error:', error.message || error)
        setData([])
        setEmployeeCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <Loading />

  return (
    <Grid container spacing={6}>
      {/* Total Karyawan */}
      <Grid item xs={12} sm={3} md={3} lg={3}>
        <CardStatVertical
          title='Jumlah Karyawan'
          subtitle='Total dalam database'
          stats={`${employeeCount}`}
          avatarColor='info'
          avatarIcon='tabler-users'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='Aktif'
          chipColor='success'
        />
      </Grid>

      {/* Telat */}
      <Grid item xs={12} sm={3} md={3} lg={3}>
        <CardStatVertical
          title='Telat'
          subtitle='Kedatangan tidak tepat waktu'
          stats={`${countLate}`}
          avatarColor='warning'
          avatarIcon='tabler-clock'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='Hari Ini'
          chipColor='warning'
        />
      </Grid>

      {/* Tepat Waktu */}
      <Grid item xs={12} sm={3} md={3} lg={3}>
        <CardStatVertical
          title='Tepat Waktu'
          subtitle='Kedatangan tepat waktu'
          stats={`${countPresent}`}
          avatarColor='success'
          avatarIcon='tabler-check'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='Hari Ini'
          chipColor='success'
        />
      </Grid>

      {/* Tidak Hadir */}
      <Grid item xs={12} sm={3} md={3} lg={3}>
        <CardStatVertical
          title='Tidak Hadir'
          subtitle='Tidak melakukan cek-in'
          stats={`${data.filter(emp => emp.status === 'absent').length}`}
          avatarColor='error'
          avatarIcon='tabler-x'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='Hari Ini'
          chipColor='error'
        />
      </Grid>

      {/* Tabel Absensi */}
      <Grid item xs={12}>
        <AttendanceHistory tableData={data} />
      </Grid>
    </Grid>
  )
}

export default AttendancePage
