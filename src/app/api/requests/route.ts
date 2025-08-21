import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { firestore as db } from '@/libs/firebase/firebase'
import { collection, getDocs, addDoc, query, where, limit as firestoreLimit, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import type { RequestDoc } from '@/types/requestTypes'
import { authOptions } from '@/libs/auth'

// Helper function to fetch user data
async function fetchUserData(uid: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        uid,
        name: userData.name || userData.displayName || userData.email || 'Unknown User',
        avatar: userData.photoURL || userData.avatar || null,
        department: userData.department || userData.divisi || null,
        employeeId: userData.employeeId || userData.nip || uid,
        email: userData.email || ''
      }
    }
    return null
  } catch (userError: any) {
    console.warn(`⚠️ Failed to fetch user ${uid}:`, userError?.message || 'Unknown error')
    return null
  }
}

// GET /api/requests - List requests with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const employeeId = searchParams.get('employeeId')
    const limitParam = searchParams.get('limit')
    const search = searchParams.get('search')

    console.log('🔍 Requests API called with params:', {
      status, type, dateFrom, dateTo, employeeId, limitParam, search
    })

    // Build query step by step
    const limit = limitParam ? parseInt(limitParam) : 100
    let q

    // Start with the simplest possible query
    if (status !== 'all') {
      console.log(`📊 Querying with status filter: ${status}`)
      q = query(
        collection(db, 'requests'), 
        where('status', '==', status.toUpperCase()),
        firestoreLimit(limit)
      )
    } else {
      console.log('📊 Querying all documents (no status filter)')
      q = query(
        collection(db, 'requests'), 
        firestoreLimit(limit)
      )
    }

    console.log('🚀 Executing Firebase query...')
    const snapshot = await getDocs(q)
    console.log(`📄 Query completed. Found ${snapshot.size} documents`)

    if (snapshot.empty) {
      console.log('❌ Empty result set')
      return NextResponse.json({
        data: [],
        stats: {
          total: 0,
          submitted: 0,
          approved: 0,
          rejected: 0,
          needsRevision: 0,
          canceled: 0
        },
        total: 0,
        debug: {
          message: 'No request documents found in Firestore collection',
          collectionPath: 'requests',
          appliedFilters: { status, type, employeeId },
          snapshotSize: snapshot.size
        }
      })
    }

    // Process documents and collect user IDs
    const requestDocs: RequestDoc[] = []
    const userIds = new Set<string>()

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      const uid = data.employeeId || data.uid || ''
      
      if (uid) {
        userIds.add(uid)
      }

      requestDocs.push({
        id: docSnapshot.id,
        employeeId: uid,
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
      })
    })

    console.log(`✅ Processed ${requestDocs.length} request documents`)

    // Fetch user data from users collection
    console.log(`👥 Fetching user data for ${userIds.size} unique users...`)
    const userDataMap = new Map()
    
    if (userIds.size > 0) {
      try {
        const userPromises = Array.from(userIds).map(uid => fetchUserData(uid))
        const userResults = await Promise.all(userPromises)
        
        userResults.forEach(userData => {
          if (userData) {
            userDataMap.set(userData.uid, userData)
          }
        })
        
        console.log(`👥 Successfully fetched data for ${userDataMap.size} users`)
      } catch (userFetchError: any) {
        console.warn('⚠️ Failed to fetch user data:', userFetchError?.message || 'Unknown error')
      }
    }
    
    // Update request documents with user data
    requestDocs.forEach(req => {
      const userData = userDataMap.get(req.employeeId)
      if (userData) {
        req.employeeName = userData.name
        req.employeeAvatar = userData.avatar
        req.employeeDepartment = userData.department
        req.employeeEmail = userData.email
      }
    })

    // Apply client-side filters
    let filteredRequests = requestDocs

    // Type filter
    if (type && type !== 'all') {
      const beforeFilter = filteredRequests.length
      filteredRequests = filteredRequests.filter(req => req.type === type.toUpperCase())
      console.log(`📋 Type filter applied: ${beforeFilter} → ${filteredRequests.length}`)
    }

    // Date range filter
    if (dateFrom && dateTo) {
      const beforeFilter = filteredRequests.length
      filteredRequests = filteredRequests.filter(req => {
        const reqDate = req.date
        return reqDate >= dateFrom && reqDate <= dateTo
      })
      console.log(`📅 Date filter applied: ${beforeFilter} → ${filteredRequests.length}`)
    }

    // Employee filter
    if (employeeId) {
      const beforeFilter = filteredRequests.length
      filteredRequests = filteredRequests.filter(req => 
        req.employeeId === employeeId
      )
      console.log(`👤 Employee filter applied: ${beforeFilter} → ${filteredRequests.length}`)
    }

    // Search filter
    if (search) {
      const beforeFilter = filteredRequests.length
      const searchLower = search.toLowerCase()
      filteredRequests = filteredRequests.filter(req => 
        req.employeeName?.toLowerCase().includes(searchLower) ||
        req.employeeId?.toLowerCase().includes(searchLower) ||
        req.reason?.toLowerCase().includes(searchLower) ||
        req.employeeDepartment?.toLowerCase().includes(searchLower)
      )
      console.log(`🔍 Search filter applied: ${beforeFilter} → ${filteredRequests.length}`)
    }

    // Sort by date descending
    filteredRequests.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    // Calculate stats
    const stats = {
      total: filteredRequests.length,
      submitted: filteredRequests.filter(r => r.status === 'SUBMITTED').length,
      approved: filteredRequests.filter(r => r.status === 'APPROVED').length,
      rejected: filteredRequests.filter(r => r.status === 'REJECTED').length,
      needsRevision: filteredRequests.filter(r => r.status === 'NEEDS_REVISION').length,
      canceled: filteredRequests.filter(r => r.status === 'CANCELED').length
    }

    console.log('📈 Final stats:', stats)

    return NextResponse.json({
      data: filteredRequests,
      stats,
      total: filteredRequests.length
    })

  } catch (error: any) {
    console.error('💥 API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch requests', 
        message: error?.message || 'Unknown error',
        debug: {
          errorType: error.constructor?.name || 'Unknown',
          errorCode: error.code || 'unknown',
          errorMessage: error.message || 'No error message'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/requests - Create new request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      subtype,
      date,
      requested_time_in,
      requested_time_out,
      reason,
      attachments,
      locationId,
      locationSnapshot
    } = body

    // Validation
    if (!type || !['LUPA_ABSEN', 'KOREKSI_JAM'].includes(type)) {
      return NextResponse.json({ success: false, message: 'Type is required and must be LUPA_ABSEN or KOREKSI_JAM' }, { status: 400 })
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, message: 'Valid date (YYYY-MM-DD) is required' }, { status: 400 })
    }
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Reason is required' }, { status: 400 })
    }
    if (!locationId) {
      return NextResponse.json({ success: false, message: 'LocationId is required' }, { status: 400 })
    }

    const requestData: Omit<RequestDoc, 'id'> = {
      employeeId: session.user.id,
      type,
      subtype: subtype || null,
      date,
      requested_time_in: requested_time_in || null,
      requested_time_out: requested_time_out || null,
      reason: reason.trim(),
      attachments: attachments || [],
      status: 'SUBMITTED',
      reviewerId: null,
      reviewedAt: null,
      reviewerNote: null,
      locationId,
      locationSnapshot: locationSnapshot || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: 'web'
    }

    const requestsRef = collection(db, 'requests')
    const docRef = await addDoc(requestsRef, requestData)

    return NextResponse.json({ 
      success: true, 
      data: { id: docRef.id, ...requestData },
      message: 'Request created successfully'
    })

  } catch (error: any) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create request', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
