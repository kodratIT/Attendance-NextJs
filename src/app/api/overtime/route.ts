import { NextRequest, NextResponse } from 'next/server'
import { firestore as db } from '@/libs/firebase/firebase'
import { collection, getDocs, query, where, limit as firestoreLimit, doc, getDoc } from 'firebase/firestore'
import type { OvertimeRequest } from '@/types/overtimeTypes'

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
        employeeId: userData.employeeId || userData.nip || uid
      }
    }
    return null
  } catch (userError: any) {
    console.warn(`⚠️ Failed to fetch user ${uid}:`, userError?.message || 'Unknown error')
    return null
  }
}

// GET /api/overtime - List overtime requests with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userId = searchParams.get('userId')
    const area = searchParams.get('area')
    const limitParam = searchParams.get('limit')
    const search = searchParams.get('search')

    console.log('🔍 Overtime API called with params:', {
      status, dateFrom, dateTo, userId, area, limitParam, search
    })

    // Build query step by step
    const limit = limitParam ? parseInt(limitParam) : 100
    let q

    // Start with the simplest possible query
    if (status !== 'all') {
      console.log(`📊 Querying with status filter: ${status}`)
      q = query(
        collection(db, 'overtime'), 
        where('status', '==', status),
        firestoreLimit(limit)
      )
    } else {
      console.log('📊 Querying all documents (no status filter)')
      q = query(
        collection(db, 'overtime'), 
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
          totalHours: 0,
          averageHours: 0
        },
        total: 0,
        debug: {
          message: 'No overtime documents found in Firestore collection',
          collectionPath: 'overtime',
          appliedFilters: { status, userId, area },
          snapshotSize: snapshot.size
        }
      })
    }

    // Process documents and collect user IDs
    const overtimeRequests: OvertimeRequest[] = []
    const userIds = new Set<string>()

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      const uid = data.uid || data.userId || ''
      
      if (uid) {
        userIds.add(uid)
      }

      overtimeRequests.push({
        id: docSnapshot.id,
        uid: uid,
        userId: data.userId || data.id || uid,
        userName: data.userName || data.name || '',
        userAvatar: data.userAvatar || '',
        userDepartment: data.userDepartment || data.department || '',
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
      })
    })

    console.log(`✅ Processed ${overtimeRequests.length} overtime requests`)

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
    
    // Update overtime requests with user data
    overtimeRequests.forEach(req => {
      const userData = userDataMap.get(req.uid)
      if (userData) {
        req.userName = userData.name
        req.userAvatar = userData.avatar
        req.userDepartment = userData.department
        req.userId = userData.employeeId
      }
    })

    // Apply client-side filters
    let filteredRequests = overtimeRequests

    // Date range filter
    if (dateFrom && dateTo) {
      const beforeFilter = filteredRequests.length
      filteredRequests = filteredRequests.filter(req => {
        const reqDate = req.date
        return reqDate >= dateFrom && reqDate <= dateTo
      })
      console.log(`📅 Date filter applied: ${beforeFilter} → ${filteredRequests.length}`)
    }

    // User filter
    if (userId) {
      const beforeFilter = filteredRequests.length
      filteredRequests = filteredRequests.filter(req => 
        req.uid === userId || req.userId === userId
      )
      console.log(`👤 User filter applied: ${beforeFilter} → ${filteredRequests.length}`)
    }

    // Area filter
    if (area) {
      const beforeFilter = filteredRequests.length
      filteredRequests = filteredRequests.filter(req => req.areas === area)
      console.log(`🏢 Area filter applied: ${beforeFilter} → ${filteredRequests.length}`)
    }

    // Search filter
    if (search) {
      const beforeFilter = filteredRequests.length
      const searchLower = search.toLowerCase()
      filteredRequests = filteredRequests.filter(req => 
        req.userName?.toLowerCase().includes(searchLower) ||
        req.userId?.toLowerCase().includes(searchLower) ||
        req.reason?.toLowerCase().includes(searchLower) ||
        req.userDepartment?.toLowerCase().includes(searchLower)
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
      submitted: filteredRequests.filter(r => r.status === 'submitted').length,
      approved: filteredRequests.filter(r => r.status === 'approved').length,
      rejected: filteredRequests.filter(r => r.status === 'rejected').length,
      totalHours: Math.round(filteredRequests.reduce((sum, r) => sum + ((r.durationMinutes || 0) / 60), 0) * 100) / 100,
      averageHours: filteredRequests.length > 0 
        ? Math.round((filteredRequests.reduce((sum, r) => sum + ((r.durationMinutes || 0) / 60), 0) / filteredRequests.length) * 100) / 100
        : 0
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
        error: 'Failed to fetch overtime requests', 
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

export async function POST(request: NextRequest) {
  try {
    // For future use - creating overtime requests from dashboard
    return NextResponse.json({ message: 'POST not implemented yet' }, { status: 501 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create overtime request', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
