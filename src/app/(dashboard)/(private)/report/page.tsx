'use client'

import { Suspense } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import dynamic from 'next/dynamic'

// Komponen loading sementara
const Loading = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <CircularProgress />
  </div>
)

// Lazy-load komponen ReportAttendance
const ReportAttendance = dynamic(() => import('@views/report'), {
  ssr: false, // untuk client-side only jika perlu
  loading: () => <Loading />
})

const ReportPage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <ReportAttendance />
    </Suspense>
  )
}

export default ReportPage
