import { NextRequest, NextResponse } from 'next/server'
import { firestore as db } from '@/libs/firebase/firebase'
import { collection, getDocs, query, limit as firestoreLimit } from 'firebase/firestore'

// Simple debug endpoint to check overtime collection
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking overtime collection...')
    
    // Test 1: Check if we can access the collection at all
    try {
      const collectionRef = collection(db, 'overtime')
      console.log('✅ Collection reference created successfully')
      
      // Test 2: Try to get documents without any filters
      const simpleQuery = query(collectionRef, firestoreLimit(5))
      console.log('📊 Executing simple query with limit 5...')
      
      const snapshot = await getDocs(simpleQuery)
      console.log(`📄 Simple query result: ${snapshot.size} documents found`)
      
      if (snapshot.empty) {
        // Test 3: Try alternative collection names
        console.log('⚠️ No docs in "overtime" collection, trying alternatives...')
        
        const alternatives = ['overtimes', 'lembur', 'overtime_requests']
        for (const altName of alternatives) {
          try {
            const altQuery = query(collection(db, altName), firestoreLimit(3))
            const altSnapshot = await getDocs(altQuery)
            console.log(`🔍 Collection "${altName}": ${altSnapshot.size} documents`)
            
            if (!altSnapshot.empty) {
              console.log(`🎯 Found data in collection: ${altName}`)
              
              // Show sample data
              const sampleDoc = altSnapshot.docs[0]
              console.log('📝 Sample document structure:', {
                id: sampleDoc.id,
                data: sampleDoc.data()
              })
            }
          } catch (altError: any) {
            console.log(`❌ Collection "${altName}" error:`, altError?.message || 'Unknown error')
          }
        }
        
        return NextResponse.json({
          status: 'no_data',
          message: 'No documents found in overtime collection',
          tested_collections: ['overtime', ...alternatives],
          debug: {
            firebase_connected: true,
            collection_accessible: true,
            document_count: 0
          }
        })
      }
      
      // Test 4: Show actual document structure
      const documents: any[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        documents.push({
          id: doc.id,
          fields: Object.keys(data),
          sample_data: {
            uid: data.uid,
            status: data.status,
            date: data.date,
            startAt: data.startAt,
            endAt: data.endAt,
            durationMinutes: data.durationMinutes,
            userName: data.userName,
            reason: data.reason
          }
        })
      })
      
      return NextResponse.json({
        status: 'success',
        message: `Found ${snapshot.size} documents in overtime collection`,
        documents,
        debug: {
          firebase_connected: true,
          collection_accessible: true,
          document_count: snapshot.size,
          collection_name: 'overtime'
        }
      })
      
    } catch (queryError: any) {
      console.error('❌ Query error:', queryError)
      return NextResponse.json({
        status: 'query_error',
        message: 'Failed to query overtime collection',
        error: queryError.message,
        debug: {
          firebase_connected: true,
          collection_accessible: false,
          error_code: queryError.code,
          error_details: queryError.message
        }
      })
    }
    
  } catch (connectionError: any) {
    console.error('💥 Connection error:', connectionError)
    return NextResponse.json({
      status: 'connection_error',
      message: 'Failed to connect to Firebase',
      error: connectionError.message,
      debug: {
        firebase_connected: false,
        error_code: connectionError.code,
        error_details: connectionError.message
      }
    }, { status: 500 })
  }
}
