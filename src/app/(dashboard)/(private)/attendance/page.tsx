'use client'

import { useEffect, useState, Suspense } from 'react'
import { getSession } from 'next-auth/react'
import CircularProgress from '@mui/material/CircularProgress'
import type { AttendanceRowType } from '@/types/attendanceRowTypes'
import AttendanceHistory from '@views/attendance'
import axios from 'axios'

const Loading = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <CircularProgress />
  </div>
)

// Fungsi fetch data absensi berdasarkan session
const getAttendanceData = async (session: any): Promise<AttendanceRowType[]> => {
  try {
    const role = session?.user?.role?.name
    const userAreaIds: string[] = Array.isArray(session?.user?.areas)
      ? session.user.areas
      : []

      console.log("data dksfskj:",session)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) throw new Error('❌ NEXT_PUBLIC_API_URL tidak ditemukan!')

    const now = new Date()
    now.setHours(now.getHours() + 7)
    const today = now.toISOString().split('T')[0]

    const res = await axios.get(`${apiUrl}/api/attendance?fromDate=${today}&toDate=${today}`, {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      timeout: 10000,
    })

    let attendanceData: AttendanceRowType[] = res.data || []

    if (role === 'Admin') {
      attendanceData = attendanceData.filter(row =>
        typeof row.areaId === 'string' && userAreaIds.includes(row.areaId)
      )
    }

    return attendanceData
  } catch (error: any) {
    console.error('❌ Error fetch attendance:', error.message || error)
    return []
  }
}

const AttendanceApp = () => {
  const [data, setData] = useState<AttendanceRowType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const session = await getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const attendanceData = await getAttendanceData(session)
      setData(attendanceData)
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <Loading />
  return <AttendanceHistory tableData={data} />
}

const AttendancePage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <AttendanceApp />
    </Suspense>
  )
}

export default AttendancePage
