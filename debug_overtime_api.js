// Debug script untuk testing overtime API dan Firebase collection
// Run: node debug_overtime_api.js

const axios = require('axios');

async function testOvertimeAPI() {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing Overtime API...');
  console.log('🌐 Base URL:', baseURL);
  
  try {
    // Test 1: Get all overtime requests
    console.log('\n📋 Test 1: Get all overtime requests');
    const response1 = await axios.get(`${baseURL}/api/overtime?status=all`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('✅ Response status:', response1.status);
    console.log('📊 Response data:', JSON.stringify(response1.data, null, 2));
    
    // Test 2: Get submitted overtime requests only
    console.log('\n📋 Test 2: Get submitted overtime requests');
    const response2 = await axios.get(`${baseURL}/api/overtime?status=submitted`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('✅ Response status:', response2.status);
    console.log('📊 Response data:', JSON.stringify(response2.data, null, 2));
    
    // Test 3: Test with date filter
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log('\n📋 Test 3: Get with date filter');
    const response3 = await axios.get(`${baseURL}/api/overtime?status=all&dateFrom=${yesterday}&dateTo=${today}`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('✅ Response status:', response3.status);
    console.log('📊 Response data:', JSON.stringify(response3.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Test Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

// Test Firebase connection directly (simple test)
async function testFirebaseConnection() {
  console.log('\n🔥 Testing Firebase Connection...');
  
  try {
    // This would require Firebase Admin SDK setup for direct testing
    console.log('ℹ️  Direct Firebase testing requires running from Next.js environment');
    console.log('ℹ️  Use the API endpoints instead for testing');
  } catch (error) {
    console.error('❌ Firebase Connection Error:', error);
  }
}

async function main() {
  console.log('🚀 Starting Overtime API Debug Tests\n');
  
  await testOvertimeAPI();
  await testFirebaseConnection();
  
  console.log('\n✅ Debug tests completed!');
  console.log('\n💡 Tips for debugging:');
  console.log('1. Check browser Network tab for API calls');
  console.log('2. Check server console logs for Firebase query details');
  console.log('3. Verify Firebase project ID and authentication');
  console.log('4. Check Firestore rules for collection access');
  console.log('5. Ensure overtime collection exists with documents');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testOvertimeAPI, testFirebaseConnection };
