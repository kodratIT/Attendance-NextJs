import { NextRequest, NextResponse } from 'next/server'
import { findAndTestApprovedOvertime, testOvertimeAttendanceSync } from '@/utils/testOvertimeAttendanceSync'

// GET /api/test/overtime-attendance-sync - Test overtime attendance sync
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    
    let results
    
    if (userId && date) {
      // Test specific user and date
      console.log(`🧪 Testing specific overtime-attendance sync: ${userId} on ${date}`)
      const result = await testOvertimeAttendanceSync(userId, date)
      results = [result]
    } else {
      // Test all approved overtime
      console.log('🧪 Testing all approved overtime-attendance sync')
      results = await findAndTestApprovedOvertime()
    }
    
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    
    return NextResponse.json({
      success: successCount === totalCount,
      message: `Test completed: ${successCount}/${totalCount} passed`,
      results: results,
      summary: {
        total: totalCount,
        passed: successCount,
        failed: totalCount - successCount
      }
    })
    
  } catch (error: any) {
    console.error('Error running overtime-attendance sync test:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run test', 
        message: error?.message || 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST /api/test/overtime-attendance-sync - Manual test with payload
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, date, action = 'test' } = body
    
    if (!userId || !date) {
      return NextResponse.json({ 
        success: false,
        error: 'userId and date are required' 
      }, { status: 400 })
    }
    
    if (action === 'test') {
      // Test existing attendance record
      const result = await testOvertimeAttendanceSync(userId, date)
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error
      })
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Invalid action. Use action=test' 
    }, { status: 400 })
    
  } catch (error: any) {
    console.error('Error in POST overtime-attendance sync test:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run test', 
        message: error?.message || 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
