import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { firestore as db } from '@/libs/firebase/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import type { OvertimeRequest } from '@/types/overtimeTypes'
import { updateAttendanceWithOvertime, removeOvertimeFromAttendance } from '@/utils/attendanceOvertimeSync'
import { sendMobileNotification, triggerMobileRefresh } from '@/utils/mobileSync'
import { authOptions } from '@/libs/auth'

// Helper function to get user name by ID
async function getUserNameById(userId: string): Promise<string> {
  try {
    if (!userId || userId === 'dashboard-user') {
      return 'Dashboard Admin'
    }
    
    const userDocRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.name || userData.displayName || userData.email || 'Unknown User'
    }
    
    return 'Unknown User'
  } catch (error) {
    console.error('Error fetching user name:', error)
    return 'Unknown User'
  }
}

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/overtime/[id] - Get single overtime request
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const docRef = doc(db, 'overtime', id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Overtime request not found' }, { status: 404 })
    }

    const data = docSnap.data()
    const overtimeRequest: OvertimeRequest = {
      id: docSnap.id,
      uid: data.uid || '',
      userId: data.id || data.uid,
      userName: data.userName || '',
      userAvatar: data.userAvatar || '',
      userDepartment: data.userDepartment || '',
      date: data.date || '',
      startAt: data.startAt || 0,
      endAt: data.endAt || 0,
      breakMinutes: data.breakMinutes || 0,
      durationMinutes: data.durationMinutes || 0,
      type: data.type || 'weekday',
      compensationType: data.compensationType || 'cash',
      reason: data.reason || '',
      attachments: data.attachments || [],
      crossMidnight: data.crossMidnight || false,
      status: data.status || 'submitted',
      approverId: data.approverId || null,
      approverName: data.approverName || null,
      approvedAt: data.approvedAt || null,
      approverNote: data.approverNote || null,
      policyApplied: data.policyApplied || null,
      payrollPosted: data.payrollPosted || false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      areas: data.areas || '',
      shifts: data.shifts || '',
    }

    return NextResponse.json({ data: overtimeRequest })

  } catch (error: any) {
    console.error('Error fetching overtime request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overtime request', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/overtime/[id] - Update overtime request (approve/reject/revise)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    
    const { action, approverNote, ...otherUpdates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (!action || !['approve', 'reject', 'revision_requested', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Valid action is required (approve, reject, revision_requested, cancel)' }, { status: 400 })
    }

    // Get session to identify who is making the approval/rejection
    const session = await getServerSession(authOptions)
    
    const docRef = doc(db, 'overtime', id)
    
    // Check if document exists
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Overtime request not found' }, { status: 404 })
    }

    const currentData = docSnap.data()
    
    // Get real approver info from session
    const finalApproverId = session?.user?.id || 'dashboard-user'
    const finalApproverName = session?.user?.name || await getUserNameById(finalApproverId)
    
    // Prepare update data based on action
    let updateData: any = {
      updatedAt: serverTimestamp(),
      ...otherUpdates
    }

    switch (action) {
      case 'approve':
        updateData = {
          ...updateData,
          status: 'approved',
          approverId: finalApproverId,
          approverName: finalApproverName,
          approvedAt: Date.now(),
          approverNote: approverNote || null,
        }
        break
        
      case 'reject':
        updateData = {
          ...updateData,
          status: 'rejected',
          approverId: finalApproverId,
          approverName: finalApproverName,
          approvedAt: Date.now(),
          approverNote: approverNote || null,
        }
        break
        
      case 'revision_requested':
        updateData = {
          ...updateData,
          status: 'revision_requested',
          approverId: finalApproverId,
          approverName: finalApproverName,
          approverNote: approverNote || 'Revision requested',
        }
        break
        
      case 'cancel':
        updateData = {
          ...updateData,
          status: 'cancelled',
        }
        break
    }

    await updateDoc(docRef, updateData)

    // Handle attendance sync for approved overtime
    if (action === 'approve') {
      try {
        const overtimeRequest: OvertimeRequest = {
          id: id,
          uid: currentData.uid || '',
          userId: currentData.id || currentData.uid || '',
          userName: currentData.userName || '',
          userAvatar: currentData.userAvatar || '',
          userDepartment: currentData.userDepartment || '',
          date: currentData.date || '',
          startAt: currentData.startAt || 0,
          endAt: currentData.endAt || 0,
          breakMinutes: currentData.breakMinutes || 0,
          durationMinutes: currentData.durationMinutes || 0,
          type: currentData.type || 'weekday',
          compensationType: currentData.compensationType || 'cash',
          reason: currentData.reason || '',
          attachments: currentData.attachments || [],
          crossMidnight: currentData.crossMidnight || false,
          status: 'approved',
          approverId: updateData.approverId,
          approverName: updateData.approverName,
          approvedAt: updateData.approvedAt,
          approverNote: updateData.approverNote,
          policyApplied: currentData.policyApplied || null,
          payrollPosted: currentData.payrollPosted || false,
          createdAt: currentData.createdAt,
          updatedAt: Date.now(),
          areas: currentData.areas || '',
          shifts: currentData.shifts || '',
        }
        
        await updateAttendanceWithOvertime(
          overtimeRequest,
          updateData.approverId,
          updateData.approverName
        )
        console.log('✅ Attendance updated with overtime data')
        
        // Send mobile notification and trigger refresh
        try {
          await sendMobileNotification(
            overtimeRequest.userId || overtimeRequest.uid || 'unknown-user',
            overtimeRequest,
            'approve',
            updateData.approverName,
            updateData.approverNote
          )
          await triggerMobileRefresh(overtimeRequest.userId || overtimeRequest.uid || 'unknown-user')
          console.log('📱 Mobile notification sent and refresh triggered')
        } catch (mobileError) {
          console.error('⚠️ Failed to notify mobile:', mobileError)
        }
        
      } catch (attendanceError) {
        console.error('⚠️ Failed to sync with attendance:', attendanceError)
        // Continue with overtime update even if attendance sync fails
      }
    }
    
    // Handle attendance cleanup for rejected/cancelled overtime
    if (action === 'reject' || action === 'cancel') {
      try {
        const userId = currentData.userId || currentData.uid
        const date = currentData.date
        if (userId && date) {
          await removeOvertimeFromAttendance(userId, date)
          console.log('✅ Removed overtime data from attendance')
          
          // Send mobile notification for rejection/cancellation
          if (action === 'reject') {
            const overtimeRequest: OvertimeRequest = {
              id: id,
              uid: currentData.uid || '',
              userId: userId,
              userName: currentData.userName || '',
              userAvatar: currentData.userAvatar || '',
              userDepartment: currentData.userDepartment || '',
              date: currentData.date || '',
              startAt: currentData.startAt || 0,
              endAt: currentData.endAt || 0,
              breakMinutes: currentData.breakMinutes || 0,
              durationMinutes: currentData.durationMinutes || 0,
              type: currentData.type || 'weekday',
              compensationType: currentData.compensationType || 'cash',
              reason: currentData.reason || '',
              attachments: currentData.attachments || [],
              crossMidnight: currentData.crossMidnight || false,
              status: 'rejected',
              approverId: updateData.approverId,
              approverName: updateData.approverName,
              approvedAt: updateData.approvedAt,
              approverNote: updateData.approverNote,
              policyApplied: currentData.policyApplied || null,
              payrollPosted: currentData.payrollPosted || false,
              createdAt: currentData.createdAt,
              updatedAt: Date.now(),
              areas: currentData.areas || '',
              shifts: currentData.shifts || '',
            }
            
            try {
              await sendMobileNotification(
                userId,
                overtimeRequest,
                'reject',
                updateData.approverName,
                updateData.approverNote
              )
              await triggerMobileRefresh(userId)
              console.log('📱 Mobile notification sent for rejection')
            } catch (mobileError) {
              console.error('⚠️ Failed to notify mobile for rejection:', mobileError)
            }
          }
        }
      } catch (attendanceError) {
        console.error('⚠️ Failed to remove overtime from attendance:', attendanceError)
        // Continue with overtime update even if attendance sync fails
      }
    }

    // Get updated document
    const updatedDocSnap = await getDoc(docRef)
    const updatedData = updatedDocSnap.data()

    const updatedRequest: OvertimeRequest = {
      id: updatedDocSnap.id,
      uid: updatedData?.uid || '',
      userId: updatedData?.id || updatedData?.uid || '',
      userName: updatedData?.userName || '',
      userAvatar: updatedData?.userAvatar || '',
      userDepartment: updatedData?.userDepartment || '',
      date: updatedData?.date || '',
      startAt: updatedData?.startAt || 0,
      endAt: updatedData?.endAt || 0,
      breakMinutes: updatedData?.breakMinutes || 0,
      durationMinutes: updatedData?.durationMinutes || 0,
      type: updatedData?.type || 'weekday',
      compensationType: updatedData?.compensationType || 'cash',
      reason: updatedData?.reason || '',
      attachments: updatedData?.attachments || [],
      crossMidnight: updatedData?.crossMidnight || false,
      status: updatedData?.status || 'submitted',
      approverId: updatedData?.approverId || null,
      approverName: updatedData?.approverName || null,
      approvedAt: updatedData?.approvedAt || null,
      approverNote: updatedData?.approverNote || null,
      policyApplied: updatedData?.policyApplied || null,
      payrollPosted: updatedData?.payrollPosted || false,
      createdAt: updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt,
      areas: updatedData?.areas || '',
      shifts: updatedData?.shifts || '',
    }

    return NextResponse.json({ 
      data: updatedRequest,
      message: `Overtime request ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'revision_requested' ? 'marked for revision' : 'cancelled'} successfully`
    })

  } catch (error: any) {
    console.error('Error updating overtime request:', error)
    return NextResponse.json(
      { error: 'Failed to update overtime request', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/overtime/[id] - Delete overtime request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // For future use if needed
    return NextResponse.json({ message: 'DELETE not implemented yet' }, { status: 501 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete overtime request', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
