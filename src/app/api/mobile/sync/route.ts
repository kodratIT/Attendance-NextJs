import { NextRequest, NextResponse } from 'next/server'
import { forceMobileSync, triggerMobileRefresh } from '@/utils/mobileSync'
import { firestore as db } from '@/libs/firebase/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

// GET /api/mobile/sync?userId=USER_ID - Trigger manual refresh untuk mobile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'userId parameter is required' 
      }, { status: 400 })
    }
    
    // Trigger mobile refresh
    const result = await forceMobileSync(userId)
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('Error in mobile sync GET:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to trigger mobile sync', 
        message: error?.message || 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST /api/mobile/sync - Setup atau update user sync document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action = 'setup', data = {} } = body
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'userId is required' 
      }, { status: 400 })
    }
    
    if (action === 'setup') {
      // Setup initial sync document for user
      const userSyncRef = doc(db, 'userSync', userId)
      
      const syncData = {
        userId: userId,
        overtimeLastUpdated: serverTimestamp(),
        needsRefresh: false,
        lastSyncTrigger: 'initial_setup',
        setupAt: serverTimestamp(),
        ...data
      }
      
      await setDoc(userSyncRef, syncData, { merge: true })
      
      return NextResponse.json({
        success: true,
        message: 'User sync document setup successfully',
        data: { userId, action: 'setup' }
      })
      
    } else if (action === 'refresh') {
      // Manual refresh trigger
      await triggerMobileRefresh(userId)
      
      return NextResponse.json({
        success: true,
        message: 'Mobile refresh triggered successfully',
        data: { userId, action: 'refresh', timestamp: Date.now() }
      })
      
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid action. Use setup or refresh' 
      }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error('Error in mobile sync POST:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process mobile sync request', 
        message: error?.message || 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/mobile/sync?userId=USER_ID - Clear user sync data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'userId parameter is required' 
      }, { status: 400 })
    }
    
    // Reset sync document
    const userSyncRef = doc(db, 'userSync', userId)
    await setDoc(userSyncRef, {
      needsRefresh: false,
      lastSyncTrigger: 'reset',
      resetAt: serverTimestamp()
    }, { merge: true })
    
    return NextResponse.json({
      success: true,
      message: 'User sync data cleared successfully',
      data: { userId, action: 'reset' }
    })
    
  } catch (error: any) {
    console.error('Error in mobile sync DELETE:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear mobile sync data', 
        message: error?.message || 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
