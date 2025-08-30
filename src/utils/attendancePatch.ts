import { firestore as db } from '@/libs/firebase/firebase'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore'
import type { RequestDoc } from '@/types/requestTypes'

// Utility function to convert time format from HH:mm to HH.mm.ss
function formatTimeForAttendance(timeString: string): string {
  if (!timeString || timeString === '-') return '-'
  
  // If already in HH.mm.ss format, return as is
  if (timeString.includes('.') && timeString.split('.').length === 3) {
    return timeString
  }
  
  // Convert HH:mm to HH.mm.ss
  if (timeString.includes(':')) {
    const parts = timeString.split(':')
    if (parts.length === 2) {
      return `${parts[0]}.${parts[1]}.00`
    }
  }
  
  return timeString
}

// Get user data for attendance record
async function getUserAttendanceData(userId: string) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      throw new Error(`User not found: ${userId}`)
    }
    
    const userData = userSnap.data()
    return {
      name: userData.name || 'Unknown',
      avatar: userData.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    throw error
  }
}

// Get location data from locationId
async function getLocationData(locationId: string) {
  try {
    if (!locationId) {
      return {
        name: 'Unknown',
        latitude: 0,
        longitude: 0
      }
    }
    
    const locationRef = doc(db, 'locations', locationId)
    const locationSnap = await getDoc(locationRef)
    
    if (locationSnap.exists()) {
      const locationData = locationSnap.data()
      return {
        name: locationData.name || 'Unknown',
        latitude: locationData.geo?.lat || locationData.latitude || 0,
        longitude: locationData.geo?.lng || locationData.longitude || 0
      }
    }
    
    return {
      name: 'Unknown',
      latitude: 0,
      longitude: 0
    }
  } catch (error) {
    console.error('Error fetching location data:', error)
    return {
      name: 'Unknown',
      latitude: 0,
      longitude: 0
    }
  }
}

// Calculate working hours and status
function calculateAttendanceMetrics(checkInTime: string, checkOutTime: string, date: string) {
  if (!checkInTime || checkInTime === '-' || !checkOutTime || checkOutTime === '-') {
    return {
      workingHours: 0,
      lateBy: 0,
      earlyLeaveBy: 0,
      status: 'present'
    }
  }
  
  try {
    // Convert time format for calculation
    const checkInColon = checkInTime.replace(/\./g, ':')
    const checkOutColon = checkOutTime.replace(/\./g, ':')
    
    const checkInDate = new Date(`${date}T${checkInColon}+07:00`)
    const checkOutDate = new Date(`${date}T${checkOutColon}+07:00`)
    
    // Handle overnight checkout
    if (checkOutDate < checkInDate) {
      checkOutDate.setDate(checkOutDate.getDate() + 1)
    }
    
    const workingSeconds = Math.max(0, (checkOutDate.getTime() - checkInDate.getTime()) / 1000)
    
    // Simple status determination - can be enhanced based on shift rules
    const status = 'present' // Default to present for approved requests
    
    return {
      workingHours: workingSeconds,
      lateBy: 0, // Can be calculated based on shift start time
      earlyLeaveBy: 0, // Can be calculated based on shift end time
      status
    }
  } catch (error) {
    console.error('Error calculating attendance metrics:', error)
    return {
      workingHours: 0,
      lateBy: 0,
      earlyLeaveBy: 0,
      status: 'present'
    }
  }
}

// Function to call attendance API for check-in
async function callAttendanceCheckInAPI(employeeId: string, areaId: string, date: string, checkInTime: string): Promise<any> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiUrl}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: employeeId,
        areaId: areaId,
        date: date,
        checkInTime: checkInTime, // Format: HH:mm
        keterangan: 'Manual entry from approved request'
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create attendance check-in')
    }
    
    return await response.json()
  } catch (error: any) {
    console.error('Error calling attendance check-in API:', error)
    throw error
  }
}

// Function to call attendance API for check-out
async function callAttendanceCheckOutAPI(attendanceData: any, checkOutTime: string, areaId: string): Promise<any> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiUrl}/api/attendance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          userId: attendanceData.userId,
          attendanceId: attendanceData.date
        },
        checkOutTime: checkOutTime, // Format: HH:mm
        areaId: areaId
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to update attendance check-out')
    }
    
    return await response.json()
  } catch (error: any) {
    console.error('Error calling attendance check-out API:', error)
    throw error
  }
}

// Convert time format from HH.mm.ss to HH:mm for API
function formatTimeForAPI(timeString: string): string {
  if (!timeString || timeString === '-') return ''
  
  // If in HH.mm.ss format, convert to HH:mm
  if (timeString.includes('.')) {
    const parts = timeString.split('.')
    return `${parts[0]}:${parts[1]}`
  }
  
  // If already in HH:mm format, return as is
  return timeString
}

// Main function to apply attendance patch using API endpoints
export async function applyAttendancePatch(request: RequestDoc): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📝 Applying attendance patch via API for request ${request.id}`)
    
    const { employeeId, date, type, subtype, requested_time_in, requested_time_out, locationId } = request
    
    if (!employeeId || !date) {
      throw new Error('Employee ID and date are required')
    }
    
    console.log(`📅 Processing request for date: ${date}, type: ${type}, subtype: ${subtype || 'null (treated as BOTH)'}`)
    
    // Check if attendance record already exists
    const attendanceRef = doc(db, `attendance/${employeeId}/day`, date)
    const attendanceSnap = await getDoc(attendanceRef)
    const existingData = attendanceSnap.exists() ? attendanceSnap.data() : null
    
    console.log(`📊 Existing attendance data: ${existingData ? 'Found' : 'Not found'}`)
    
    let result: any = null
    let message = ''
    
    if (type === 'LUPA_ABSEN') {
      // For LUPA_ABSEN, create new attendance record with both times
      console.log('🆕 Processing LUPA_ABSEN - creating new attendance record')
      
      if (!requested_time_in) {
        throw new Error('Check-in time is required for LUPA_ABSEN')
      }
      
      // Step 1: Create check-in record
      const checkInTime = formatTimeForAPI(requested_time_in)
      console.log(`🔄 Creating check-in record for ${employeeId} on ${date} at ${checkInTime}`)
      
      result = await callAttendanceCheckInAPI(employeeId, locationId, date, checkInTime)
      message = 'New attendance record created with check-in'
      
      // Step 2: If check-out time is provided, add check-out
      if (requested_time_out && requested_time_out !== '-') {
        const checkOutTime = formatTimeForAPI(requested_time_out)
        console.log(`🔄 Adding check-out record for ${employeeId} on ${date} at ${checkOutTime}`)
        
        // Wait a moment for check-in to be processed
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const attendanceData = {
          userId: employeeId,
          date: date
        }
        
        result = await callAttendanceCheckOutAPI(attendanceData, checkOutTime, locationId)
        message = 'New attendance record created with both check-in and check-out'
      }
      
    } else if (type === 'KOREKSI_JAM') {
      // For KOREKSI_JAM, update existing record times
      console.log('✏️ Processing KOREKSI_JAM - updating existing attendance times')
      
      // If no existing data, we can't correct times
      if (!existingData) {
        // But if subtype is null (BOTH), we can treat it like LUPA_ABSEN
        if (subtype === null && requested_time_in) {
          console.log('⚠️ No existing record found, but subtype is null - creating new record')
          
          const checkInTime = formatTimeForAPI(requested_time_in)
          result = await callAttendanceCheckInAPI(employeeId, locationId, date, checkInTime)
          
          if (requested_time_out && requested_time_out !== '-') {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const checkOutTime = formatTimeForAPI(requested_time_out)
            const attendanceData = { userId: employeeId, date: date }
            result = await callAttendanceCheckOutAPI(attendanceData, checkOutTime, locationId)
            message = 'New attendance record created (no existing data to correct)'
          } else {
            message = 'New check-in record created (no existing data to correct)'
          }
        } else {
          throw new Error('Cannot correct time: No existing attendance record found')
        }
      } else {
        // Handle different subtypes or null (treat null as BOTH)
        const effectiveSubtype = subtype || 'BOTH'
        console.log(`🎯 Effective subtype: ${effectiveSubtype}`)
        
        if (effectiveSubtype === 'CHECKIN' && requested_time_in) {
          // Update check-in time only
          const checkInTime = formatTimeForAPI(requested_time_in)
          console.log(`🔄 Correcting check-in time for ${employeeId} on ${date} to ${checkInTime}`)
          
          result = await callAttendanceCheckInAPI(employeeId, locationId, date, checkInTime)
          
          // Restore original check-out if it existed
          if (existingData.checkOut?.time && existingData.checkOut.time !== '-') {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const originalCheckOutTime = formatTimeForAPI(existingData.checkOut.time)
            const attendanceData = { userId: employeeId, date: date }
            result = await callAttendanceCheckOutAPI(attendanceData, originalCheckOutTime, locationId)
          }
          
          message = 'Check-in time corrected'
          
        } else if (effectiveSubtype === 'CHECKOUT' && requested_time_out) {
          // Update check-out time only
          const checkOutTime = formatTimeForAPI(requested_time_out)
          console.log(`🔄 Correcting check-out time for ${employeeId} on ${date} to ${checkOutTime}`)
          
          const attendanceData = { userId: employeeId, date: date }
          result = await callAttendanceCheckOutAPI(attendanceData, checkOutTime, locationId)
          message = 'Check-out time corrected'
          
        } else if (effectiveSubtype === 'BOTH') {
          // Update both times (this is the case for your example data)
          console.log('📝 Updating both check-in and check-out times')
          
          if (requested_time_in) {
            const checkInTime = formatTimeForAPI(requested_time_in)
            console.log(`🔄 Correcting check-in time for ${employeeId} on ${date} to ${checkInTime}`)
            result = await callAttendanceCheckInAPI(employeeId, locationId, date, checkInTime)
          }
          
          if (requested_time_out && requested_time_out !== '-') {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const checkOutTime = formatTimeForAPI(requested_time_out)
            console.log(`🔄 Correcting check-out time for ${employeeId} on ${date} to ${checkOutTime}`)
            
            const attendanceData = { userId: employeeId, date: date }
            result = await callAttendanceCheckOutAPI(attendanceData, checkOutTime, locationId)
          }
          
          message = 'Both check-in and check-out times corrected'
        }
      }
    }
    
    console.log(`✅ Attendance patch applied successfully: ${message}`)
    
    return {
      success: true,
      message: message || 'Attendance record updated successfully'
    }
    
  } catch (error: any) {
    console.error('❌ Error applying attendance patch via API:', error)
    return {
      success: false,
      message: error.message || 'Failed to apply attendance patch'
    }
  }
}

// Legacy direct database function - keeping as backup
export async function applyAttendancePatchDirect(request: RequestDoc): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📝 Applying attendance patch directly to DB for request ${request.id}`)
    
    const { employeeId, date, type, subtype, requested_time_in, requested_time_out, locationId } = request
    
    if (!employeeId || !date) {
      throw new Error('Employee ID and date are required')
    }
    
    // Get existing attendance record
    const attendanceRef = doc(db, `attendance/${employeeId}/day`, date)
    const attendanceSnap = await getDoc(attendanceRef)
    
    let existingData: any = {}
    if (attendanceSnap.exists()) {
      existingData = attendanceSnap.data()
    }
    
    // Get user data
    const userData = await getUserAttendanceData(employeeId)
    
    // Get location data
    const locationData = await getLocationData(locationId)
    
    // Prepare attendance data based on request type and subtype
    let attendanceData: any = {
      attendanceId: date,
      userId: employeeId,
      name: userData.name,
      date: date,
      avatar: userData.avatar,
      updatedAt: serverTimestamp(),
      areas: locationData.name,
      areaId: locationId, // Use locationId as areaId for compatibility
      ...existingData // Keep existing data
    }
    
    // Handle different request types
    if (type === 'LUPA_ABSEN') {
      // For LUPA_ABSEN, create new attendance record
      const checkInTime = formatTimeForAttendance(requested_time_in || '08.00.00')
      const checkOutTime = formatTimeForAttendance(requested_time_out || '-')
      
      attendanceData.checkIn = {
        time: checkInTime,
        faceVerified: false, // Manual entry
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          name: locationData.name
        }
      }
      
      attendanceData.checkOut = {
        time: checkOutTime,
        faceVerified: false,
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          name: locationData.name
        }
      }
      
      if (!existingData.createdAt) {
        attendanceData.createdAt = serverTimestamp()
      }
      
    } else if (type === 'KOREKSI_JAM') {
      // For KOREKSI_JAM, update existing times based on subtype
      if (subtype === 'CHECKIN' || subtype === 'BOTH') {
        if (requested_time_in) {
          attendanceData.checkIn = {
            ...existingData.checkIn,
            time: formatTimeForAttendance(requested_time_in),
            location: {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              name: locationData.name
            }
          }
        }
      }
      
      if (subtype === 'CHECKOUT' || subtype === 'BOTH') {
        if (requested_time_out) {
          attendanceData.checkOut = {
            ...existingData.checkOut,
            time: formatTimeForAttendance(requested_time_out),
            location: {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              name: locationData.name
            }
          }
        }
      }
    }
    
    // Calculate metrics
    const checkInTime = attendanceData.checkIn?.time || '-'
    const checkOutTime = attendanceData.checkOut?.time || '-'
    const metrics = calculateAttendanceMetrics(checkInTime, checkOutTime, date)
    
    attendanceData = {
      ...attendanceData,
      ...metrics
    }
    
    // Set default shift if not exists
    if (!attendanceData.shiftName && !attendanceData.shifts) {
      attendanceData.shiftName = 'Shift Pagi' // Default shift
    }
    
    // Save attendance record
    await setDoc(attendanceRef, attendanceData)
    
    console.log(`✅ Attendance patch applied successfully for ${employeeId} on ${date}`)
    
    return {
      success: true,
      message: `Attendance record ${existingData.attendanceId ? 'updated' : 'created'} successfully`
    }
    
  } catch (error: any) {
    console.error('❌ Error applying attendance patch:', error)
    return {
      success: false,
      message: error.message || 'Failed to apply attendance patch'
    }
  }
}

// Function to validate if request can be applied to attendance
export function validateAttendancePatch(request: RequestDoc): { valid: boolean; message: string } {
  const { employeeId, date, type, subtype, requested_time_in, requested_time_out } = request
  
  if (!employeeId) {
    return { valid: false, message: 'Employee ID is required' }
  }
  
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, message: 'Valid date (YYYY-MM-DD) is required' }
  }
  
  if (type === 'LUPA_ABSEN') {
    if (!requested_time_in) {
      return { valid: false, message: 'Check-in time is required for LUPA_ABSEN' }
    }
  } else if (type === 'KOREKSI_JAM') {
    // For KOREKSI_JAM, treat null subtype as BOTH
    const effectiveSubtype = subtype || 'BOTH'
    
    if (effectiveSubtype === 'BOTH') {
      // For BOTH, we need at least one time
      if (!requested_time_in && !requested_time_out) {
        return { valid: false, message: 'At least one time (in or out) is required for KOREKSI_JAM' }
      }
    } else if (effectiveSubtype === 'CHECKIN') {
      if (!requested_time_in) {
        return { valid: false, message: 'Check-in time is required for CHECKIN correction' }
      }
    } else if (effectiveSubtype === 'CHECKOUT') {
      if (!requested_time_out) {
        return { valid: false, message: 'Check-out time is required for CHECKOUT correction' }
      }
    }
  }
  
  console.log(`✅ Request validation passed for type: ${type}, subtype: ${subtype || 'null (BOTH)'}`)
  return { valid: true, message: 'Valid request' }
}
