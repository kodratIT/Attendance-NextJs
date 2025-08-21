// Simple test to check Firebase connection and overtime collection
// This script can be run in browser console or as a test

console.log('🔥 Testing Firebase Connection for Overtime Collection');

// Test function that can be called from browser console
async function testFirebaseOvertimeCollection() {
  try {
    console.log('📡 Making API request to overtime endpoint...');
    
    // Test the API endpoint
    const response = await fetch('/api/overtime?status=all&limit=10', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
    if (data.debug) {
      console.log('🐛 Debug info:', data.debug);
    }
    
    if (data.data && data.data.length > 0) {
      console.log('🎉 Found overtime data!');
      console.log('📝 Sample record:', data.data[0]);
    } else {
      console.log('⚠️ No overtime data found');
      
      // Check if it's a query issue vs no data issue
      if (data.debug && data.debug.snapshotSize === 0) {
        console.log('💭 Possible causes:');
        console.log('1. No overtime documents exist in Firestore');
        console.log('2. Firebase rules blocking access');
        console.log('3. Incorrect collection name');
        console.log('4. Firebase connection issue');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment');
  console.log('💡 You can call testFirebaseOvertimeCollection() manually');
  
  // Auto-run after a delay
  setTimeout(() => {
    testFirebaseOvertimeCollection();
  }, 1000);
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFirebaseOvertimeCollection };
}
