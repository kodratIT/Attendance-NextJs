import { firestore as db } from '@/libs/firebase/firebase'
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore'
import type { OvertimeRequest } from '@/types/overtimeTypes'

/**
 * Update attendance record dengan data lembur yang disetujui
 * @param overtimeData - Data lembur yang disetujui
 * @param approverId - ID approver
 * @param approverName - Nama approver
 */
export async function updateAttendanceWithOvertime(
  overtimeData: OvertimeRequest,
  approverId: string,
  approverName: string
): Promise<void> {
  try {
    const userId = overtimeData.userId || overtimeData.uid
    if (!userId) {
      throw new Error('User ID tidak ditemukan dalam data lembur')
    }

    // Format tanggal untuk path attendance (YYYY-MM-DD)
    const attendanceDate = overtimeData.date
    
    // Reference ke dokumen attendance
    const attendanceRef = doc(db, 'attendance', userId, 'day', attendanceDate)
    
    // Cek apakah dokumen attendance sudah ada
    const attendanceSnap = await getDoc(attendanceRef)
    
    const lemburDetail = {
      overtimeId: overtimeData.id,
      startAt: overtimeData.startAt,
      endAt: overtimeData.endAt,
      durationMinutes: overtimeData.durationMinutes || 0,
      reason: overtimeData.reason || '',
      approvedAt: Date.now(),
      approvedBy: approverId,
      approverName: approverName,
      crossMidnight: overtimeData.crossMidnight || false
    }

    const overtimeFields = {
      statusLembur: true,
      lemburDetail: lemburDetail,
      updatedAt: Date.now()
    }

    if (attendanceSnap.exists()) {
      // Update dokumen yang sudah ada
      await updateDoc(attendanceRef, overtimeFields)
      console.log(`✅ Updated attendance record for ${userId} on ${attendanceDate} with overtime data`)
    } else {
      // Buat dokumen attendance baru dengan data minimal
      const newAttendanceData = {
        attendanceId: `${userId}_${attendanceDate}`,
        date: attendanceDate,
        userId: userId,
        name: overtimeData.userName || 'Unknown',
        avatar: overtimeData.userAvatar || '',
        shifts: '',
        areas: '',
        areaId: '',
        checkIn: {
          time: '',
          faceVerified: false,
          location: {
            latitude: 0,
            longitude: 0,
            name: ''
          }
        },
        checkOut: {
          time: '',
          faceVerified: false,
          location: {
            latitude: 0,
            longitude: 0,
            name: ''
          }
        },
        createdAt: Date.now(),
        earlyLeaveBy: 0,
        lateBy: 0,
        status: 'overtime', // Status khusus untuk hari lembur
        workingHours: lemburDetail.durationMinutes / 60,
        ...overtimeFields
      }
      
      await setDoc(attendanceRef, newAttendanceData)
      console.log(`✅ Created new attendance record for ${userId} on ${attendanceDate} with overtime data`)
    }

    console.log('📋 Overtime detail added to attendance:', lemburDetail)
    
  } catch (error) {
    console.error('❌ Error updating attendance with overtime:', error)
    throw new Error(`Gagal mengupdate data attendance: ${error}`)
  }
}

/**
 * Remove overtime data from attendance record (untuk rollback)
 * @param userId - ID user
 * @param date - Tanggal attendance (YYYY-MM-DD)
 */
export async function removeOvertimeFromAttendance(
  userId: string,
  date: string
): Promise<void> {
  try {
    const attendanceRef = doc(db, 'attendance', userId, 'day', date)
    const attendanceSnap = await getDoc(attendanceRef)
    
    if (attendanceSnap.exists()) {
      await updateDoc(attendanceRef, {
        statusLembur: false,
        lemburDetail: null,
        updatedAt: Date.now()
      })
      console.log(`✅ Removed overtime data from attendance for ${userId} on ${date}`)
    }
  } catch (error) {
    console.error('❌ Error removing overtime from attendance:', error)
    throw error
  }
}
