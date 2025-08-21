/**
 * Test Script untuk Overtime-Attendance Sync
 * 
 * Script ini membantu memvalidasi bahwa:
 * 1. Saat lembur disetujui, attendance record terupdate dengan benar
 * 2. Field statusLembur dan lemburDetail ditambahkan
 * 3. Error handling berjalan dengan baik
 */

import { firestore as db } from '@/libs/firebase/firebase'
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore'

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

/**
 * Test manual untuk cek apakah attendance terupdate setelah overtime disetujui
 */
export async function testOvertimeAttendanceSync(
  userId: string, 
  date: string
): Promise<TestResult> {
  try {
    console.log(`🧪 Testing overtime-attendance sync for user ${userId} on ${date}`)
    
    // 1. Cek attendance record
    const attendanceRef = doc(db, 'attendance', userId, 'day', date)
    const attendanceSnap = await getDoc(attendanceRef)
    
    if (!attendanceSnap.exists()) {
      return {
        success: false,
        message: 'Attendance record tidak ditemukan',
        error: `No attendance found for ${userId} on ${date}`
      }
    }
    
    const attendanceData = attendanceSnap.data()
    
    // 2. Cek apakah field lembur ada
    const hasOvertimeFlag = attendanceData.statusLembur === true
    const hasOvertimeDetail = attendanceData.lemburDetail && typeof attendanceData.lemburDetail === 'object'
    
    if (!hasOvertimeFlag) {
      return {
        success: false,
        message: 'Field statusLembur tidak true atau tidak ada',
        data: { statusLembur: attendanceData.statusLembur }
      }
    }
    
    if (!hasOvertimeDetail) {
      return {
        success: false,
        message: 'Field lemburDetail tidak ada atau format salah',
        data: { lemburDetail: attendanceData.lemburDetail }
      }
    }
    
    // 3. Validasi struktur lemburDetail
    const detail = attendanceData.lemburDetail
    const requiredFields = ['overtimeId', 'startAt', 'endAt', 'durationMinutes', 'reason', 'approvedAt', 'approvedBy', 'approverName']
    const missingFields = requiredFields.filter(field => !detail.hasOwnProperty(field))
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Field lemburDetail tidak lengkap. Missing: ${missingFields.join(', ')}`,
        data: { lemburDetail: detail, missingFields }
      }
    }
    
    return {
      success: true,
      message: '✅ Overtime-attendance sync berhasil!',
      data: {
        statusLembur: attendanceData.statusLembur,
        lemburDetail: attendanceData.lemburDetail,
        attendanceId: attendanceData.attendanceId,
        workingHours: attendanceData.workingHours
      }
    }
    
  } catch (error: any) {
    return {
      success: false,
      message: 'Error saat testing sync',
      error: error?.message || 'Unknown error'
    }
  }
}

/**
 * Test untuk cari overtime yang sudah disetujui dan cek attendance-nya
 */
export async function findAndTestApprovedOvertime(): Promise<TestResult[]> {
  try {
    console.log('🔍 Mencari overtime yang sudah disetujui untuk testing...')
    
    // Cari overtime dengan status approved
    const overtimeQuery = query(
      collection(db, 'overtime'),
      where('status', '==', 'approved'),
      limit(5)
    )
    
    const overtimeSnap = await getDocs(overtimeQuery)
    
    if (overtimeSnap.empty) {
      return [{
        success: false,
        message: 'Tidak ada overtime yang disetujui untuk testing'
      }]
    }
    
    const results: TestResult[] = []
    
    for (const doc of overtimeSnap.docs) {
      const data = doc.data()
      const userId = data.userId || data.uid
      const date = data.date
      
      if (userId && date) {
        const testResult = await testOvertimeAttendanceSync(userId, date)
        results.push({
          ...testResult,
          data: {
            ...testResult.data,
            overtimeId: doc.id,
            userId,
            date
          }
        })
      }
    }
    
    return results
    
  } catch (error: any) {
    return [{
      success: false,
      message: 'Error saat mencari approved overtime',
      error: error?.message || 'Unknown error'
    }]
  }
}

/**
 * Utility untuk print hasil test dengan format yang rapi
 */
export function printTestResults(results: TestResult[]): void {
  console.log('\n📊 === HASIL TEST OVERTIME-ATTENDANCE SYNC ===')
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.success ? '✅' : '❌'} ${result.message}`)
    
    if (result.data) {
      console.log('   Data:', JSON.stringify(result.data, null, 2))
    }
    
    if (result.error) {
      console.log('   Error:', result.error)
    }
  })
  
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  
  console.log(`\n📈 Summary: ${successCount}/${totalCount} tests passed`)
  console.log('========================================\n')
}

// Export untuk direct usage jika diperlukan
export const testHelpers = {
  testOvertimeAttendanceSync,
  findAndTestApprovedOvertime,
  printTestResults
}
