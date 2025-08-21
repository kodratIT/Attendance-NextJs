import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { firestore as db } from '@/libs/firebase/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import type { RequestDoc } from '@/types/requestTypes'
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

// Helper function to get user data by ID
async function getUserDataById(userId: string) {
  try {
    const userDocRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        id: userId,
        name: userData.name || userData.displayName || userData.email || 'Unknown User',
        email: userData.email || '',
        department: userData.department || '',
        avatar: userData.avatar || userData.photoURL || ''
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/requests/[id] - Get single request
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 })
    }

    const docRef = doc(db, 'requests', id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 })
    }

    const data = docSnap.data()
    const requestDoc: RequestDoc = {
      id: docSnap.id,
      employeeId: data.employeeId || '',
      type: data.type || 'LUPA_ABSEN',
      subtype: data.subtype || null,
      date: data.date || '',
      requested_time_in: data.requested_time_in || null,
      requested_time_out: data.requested_time_out || null,
      reason: data.reason || '',
      attachments: data.attachments || [],
      status: data.status || 'SUBMITTED',
      reviewerId: data.reviewerId || null,
      reviewedAt: data.reviewedAt || null,
      reviewerNote: data.reviewerNote || null,
      locationId: data.locationId || '',
      locationSnapshot: data.locationSnapshot || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      source: data.source || 'web',
    }

    return NextResponse.json({ success: true, data: requestDoc })

  } catch (error: any) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch request', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/requests/[id] - Update request (approve/reject/revision)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    
    const { action, reviewerNote, ...otherUpdates } = body

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 })
    }

    if (!action || !['APPROVE', 'REJECT', 'NEEDS_REVISION', 'CANCEL'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Valid action is required (APPROVE, REJECT, NEEDS_REVISION, CANCEL)' }, { status: 400 })
    }

    // Get session to identify who is making the review
    const session = await getServerSession(authOptions)
    
    const docRef = doc(db, 'requests', id)
    
    // Check if document exists
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 })
    }

    const currentData = docSnap.data()
    
    // Get reviewer info from session
    const reviewerId = session?.user?.id || 'dashboard-user'
    const reviewerName = session?.user?.name || await getUserNameById(reviewerId)
    
    // Prepare update data based on action
    let updateData: any = {
      updatedAt: serverTimestamp(),
      ...otherUpdates
    }

    switch (action) {
      case 'APPROVE':
        updateData = {
          ...updateData,
          status: 'APPROVED',
          reviewerId: reviewerId,
          reviewerNote: reviewerNote || null,
          reviewedAt: serverTimestamp(),
        }
        break
        
      case 'REJECT':
        updateData = {
          ...updateData,
          status: 'REJECTED',
          reviewerId: reviewerId,
          reviewerNote: reviewerNote || null,
          reviewedAt: serverTimestamp(),
        }
        break
        
      case 'NEEDS_REVISION':
        updateData = {
          ...updateData,
          status: 'NEEDS_REVISION',
          reviewerId: reviewerId,
          reviewerNote: reviewerNote || 'Revision requested',
          reviewedAt: serverTimestamp(),
        }
        break
        
      case 'CANCEL':
        // Only the request owner or admin can cancel
        if (currentData.employeeId !== session?.user?.id) {
          // Check if user has admin permission - for now allow dashboard users
          if (reviewerId === 'dashboard-user' || session?.user?.role?.name === 'admin') {
            updateData = {
              ...updateData,
              status: 'CANCELED',
            }
          } else {
            return NextResponse.json({ success: false, message: 'Unauthorized to cancel this request' }, { status: 403 })
          }
        } else {
          updateData = {
            ...updateData,
            status: 'CANCELED',
          }
        }
        break
    }

    await updateDoc(docRef, updateData)

    // Get updated document
    const updatedDocSnap = await getDoc(docRef)
    const updatedData = updatedDocSnap.data()

    const updatedRequest: RequestDoc = {
      id: updatedDocSnap.id,
      employeeId: updatedData?.employeeId || '',
      type: updatedData?.type || 'LUPA_ABSEN',
      subtype: updatedData?.subtype || null,
      date: updatedData?.date || '',
      requested_time_in: updatedData?.requested_time_in || null,
      requested_time_out: updatedData?.requested_time_out || null,
      reason: updatedData?.reason || '',
      attachments: updatedData?.attachments || [],
      status: updatedData?.status || 'SUBMITTED',
      reviewerId: updatedData?.reviewerId || null,
      reviewedAt: updatedData?.reviewedAt || null,
      reviewerNote: updatedData?.reviewerNote || null,
      locationId: updatedData?.locationId || '',
      locationSnapshot: updatedData?.locationSnapshot || null,
      createdAt: updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt,
      source: updatedData?.source || 'web',
    }

    return NextResponse.json({ 
      success: true,
      data: updatedRequest,
      message: `Request ${action === 'APPROVE' ? 'approved' : action === 'REJECT' ? 'rejected' : action === 'NEEDS_REVISION' ? 'marked for revision' : 'cancelled'} successfully`
    })

  } catch (error: any) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update request', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
