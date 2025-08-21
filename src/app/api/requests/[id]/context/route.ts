import { NextRequest, NextResponse } from 'next/server'
import { firestore as db } from '@/libs/firebase/firebase'
import { doc, getDoc } from 'firebase/firestore'
import type { RequestDoc } from '@/types/requestTypes'

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

// Helper function to get location data by ID
async function getLocationDataById(locationId: string) {
  try {
    const locationDocRef = doc(db, 'locations', locationId)
    const locationDoc = await getDoc(locationDocRef)
    
    if (locationDoc.exists()) {
      const locationData = locationDoc.data()
      return {
        id: locationId,
        name: locationData.name || 'Unknown Location',
        address: locationData.address || '',
        geo: locationData.geo || null,
        radius: locationData.radius || 0,
        code: locationData.code || ''
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching location data:', error)
    return null
  }
}

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/requests/[id]/context - Get request with full context (user, location data)
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

    // Get user data
    const userData = await getUserDataById(requestDoc.employeeId)
    
    // Get location data
    const locationData = await getLocationDataById(requestDoc.locationId)

    // Get reviewer data if exists
    let reviewerData = null
    if (requestDoc.reviewerId) {
      reviewerData = await getUserDataById(requestDoc.reviewerId)
    }

    const contextData = {
      request: requestDoc,
      user: userData,
      location: locationData,
      reviewer: reviewerData
    }

    return NextResponse.json({ success: true, data: contextData })

  } catch (error: any) {
    console.error('Error fetching request context:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch request context', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
