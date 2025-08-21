/**
 * Mobile Sync Helper untuk Overtime Management
 * 
 * File ini berisi utilities untuk memastikan sync yang baik antara
 * web dashboard dan mobile app untuk data overtime
 */

import { firestore as db } from '@/libs/firebase/firebase'
import { doc, collection, onSnapshot, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore'
import type { OvertimeRequest } from '@/types/overtimeTypes'

// Type untuk notification mobile
interface MobileNotification {
  userId: string
  type: 'overtime_approved' | 'overtime_rejected' | 'overtime_revision_requested'
  title: string
  body: string
  data: {
    overtimeId: string
    status: string
    approverName?: string
    approverNote?: string
  }
  timestamp: number
  read: boolean
}

/**
 * Kirim notifikasi ke mobile app melalui collection notifications
 * Mobile app harus listen ke collection ini untuk mendapat update real-time
 */
export async function sendMobileNotification(
  userId: string,
  overtimeData: OvertimeRequest,
  action: 'approve' | 'reject' | 'revision_requested',
  approverName: string,
  approverNote?: string
): Promise<void> {
  try {
    const notificationData: MobileNotification = {
      userId: userId,
      type: `overtime_${action}${action === 'revision_requested' ? '' : 'd'}` as any,
      title: getNotificationTitle(action),
      body: getNotificationBody(action, overtimeData, approverName),
      data: {
        overtimeId: overtimeData.id,
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision_requested',
        approverName: approverName,
        approverNote: approverNote
      },
      timestamp: Date.now(),
      read: false
    }

    // Tambah ke collection notifications untuk user
    const notificationRef = collection(db, 'users', userId, 'notifications')
    await addDoc(notificationRef, notificationData)
    
    console.log(`📱 Mobile notification sent to user ${userId} for overtime ${action}`)
    
  } catch (error) {
    console.error('❌ Failed to send mobile notification:', error)
    // Don't throw error, let the main process continue
  }
}

/**
 * Update user's overtime cache untuk force refresh mobile app
 * Mobile app bisa listen ke dokumen ini untuk trigger refresh
 */
export async function triggerMobileRefresh(userId: string): Promise<void> {
  try {
    const userSyncRef = doc(db, 'userSync', userId)
    await updateDoc(userSyncRef, {
      overtimeLastUpdated: serverTimestamp(),
      needsRefresh: true,
      lastSyncTrigger: 'dashboard_approval'
    })
    
    console.log(`🔄 Mobile refresh triggered for user ${userId}`)
    
  } catch (error) {
    console.error('❌ Failed to trigger mobile refresh:', error)
  }
}

/**
 * Setup real-time listener untuk overtime collection
 * Function ini bisa dipanggil di mobile app untuk listen perubahan
 */
export function setupOvertimeListener(
  userId: string,
  onUpdate: (overtimeData: OvertimeRequest[]) => void,
  onError?: (error: any) => void
): () => void {
  try {
    const overtimeCollectionRef = collection(db, 'overtime')
    
    // Listen untuk perubahan di collection overtime untuk user ini
    const unsubscribe = onSnapshot(
      overtimeCollectionRef,
      (snapshot) => {
        const overtimeData: OvertimeRequest[] = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          // Filter untuk user ini saja
          if (data.userId === userId || data.uid === userId) {
            overtimeData.push({
              id: doc.id,
              ...data
            } as OvertimeRequest)
          }
        })
        
        console.log(`📱 Real-time update: ${overtimeData.length} overtime records for user ${userId}`)
        onUpdate(overtimeData)
      },
      (error) => {
        console.error('❌ Overtime listener error:', error)
        if (onError) onError(error)
      }
    )
    
    return unsubscribe
    
  } catch (error) {
    console.error('❌ Failed to setup overtime listener:', error)
    if (onError) onError(error)
    return () => {} // Return empty function
  }
}

/**
 * Setup listener untuk notification user
 * Mobile app bisa menggunakan ini untuk mendapat notifikasi real-time
 */
export function setupNotificationListener(
  userId: string,
  onNotification: (notifications: MobileNotification[]) => void,
  onError?: (error: any) => void
): () => void {
  try {
    const notificationRef = collection(db, 'users', userId, 'notifications')
    
    const unsubscribe = onSnapshot(
      notificationRef,
      (snapshot) => {
        const notifications: MobileNotification[] = []
        
        snapshot.forEach((doc) => {
          notifications.push({
            id: doc.id,
            ...doc.data()
          } as any)
        })
        
        // Sort by timestamp descending (newest first)
        notifications.sort((a, b) => b.timestamp - a.timestamp)
        
        console.log(`🔔 ${notifications.length} notifications for user ${userId}`)
        onNotification(notifications)
      },
      (error) => {
        console.error('❌ Notification listener error:', error)
        if (onError) onError(error)
      }
    )
    
    return unsubscribe
    
  } catch (error) {
    console.error('❌ Failed to setup notification listener:', error)
    if (onError) onError(error)
    return () => {}
  }
}

// Helper functions untuk notification content
function getNotificationTitle(action: string): string {
  switch (action) {
    case 'approve': return '✅ Lembur Disetujui'
    case 'reject': return '❌ Lembur Ditolak'
    case 'revision_requested': return '📝 Lembur Perlu Revisi'
    default: return '📋 Update Lembur'
  }
}

function getNotificationBody(
  action: string, 
  overtimeData: OvertimeRequest, 
  approverName: string
): string {
  const date = new Date(overtimeData.date).toLocaleDateString('id-ID')
  
  switch (action) {
    case 'approve': 
      return `Pengajuan lembur Anda pada ${date} telah disetujui oleh ${approverName}`
    case 'reject': 
      return `Pengajuan lembur Anda pada ${date} ditolak oleh ${approverName}`
    case 'revision_requested': 
      return `Pengajuan lembur Anda pada ${date} perlu direvisi. Periksa catatan dari ${approverName}`
    default: 
      return `Status pengajuan lembur Anda pada ${date} telah diupdate`
  }
}

/**
 * Manual sync trigger untuk mobile app
 * Mobile app bisa call function ini untuk force refresh data
 */
export async function forceMobileSync(userId: string): Promise<{
  success: boolean
  message: string
  timestamp: number
}> {
  try {
    await triggerMobileRefresh(userId)
    
    return {
      success: true,
      message: 'Mobile sync triggered successfully',
      timestamp: Date.now()
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to trigger sync',
      timestamp: Date.now()
    }
  }
}

// Export semua functions
export const mobileSyncHelpers = {
  sendMobileNotification,
  triggerMobileRefresh,
  setupOvertimeListener,
  setupNotificationListener,
  forceMobileSync
}
