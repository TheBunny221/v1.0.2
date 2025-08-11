import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4005/api';

// Test functions
async function testEndpoint(url, description, expectAuth = false) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (expectAuth && response.status === 401) {
      console.log(`✅ Expected 401 (Authentication required): ${data.message}`);
      return true;
    }
    
    if (response.ok) {
      console.log(`✅ Success: ${data.message}`);
      if (data.data && Array.isArray(data.data)) {
        console.log(`📊 Data count: ${data.data.length} items`);
      }
      return true;
    } else {
      console.log(`❌ Failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting System Tests...');
  console.log('=' .repeat(50));
  
  const tests = [
    // Health checks
    [`${BASE_URL}/health`, 'Health Check', false],
    
    // Public endpoints
    [`${BASE_URL}/wards`, 'Get Wards (Public)', false],
    [`${BASE_URL}/complaint-types`, 'Get Complaint Types (Public)', false],
    
    // Protected endpoints (should require auth)
    [`${BASE_URL}/system-config`, 'Get System Config (Admin only)', true],
    [`${BASE_URL}/admin/users`, 'Get Users (Admin only)', true],
    [`${BASE_URL}/complaints`, 'Get Complaints (Protected)', true],
    
    // Documentation
    [`${BASE_URL}-docs/json`, 'Swagger JSON Documentation', false],
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [url, description, expectAuth] of tests) {
    const result = await testEndpoint(url, description, expectAuth);
    if (result) passed++;
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! System is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
  
  console.log('\n📚 Available endpoints:');
  console.log('- Swagger UI: http://localhost:4005/api-docs');
  console.log('- Health Check: http://localhost:4005/api/health');
  console.log('- Wards API: http://localhost:4005/api/wards');
  console.log('- Complaint Types: http://localhost:4005/api/complaint-types');
  console.log('\n🔐 Demo Login Credentials:');
  console.log('  Admin: admin@cochinsmartcity.gov.in / admin123');
  console.log('  Ward Officer: ward.officer@cochinsmartcity.gov.in / ward123');
  console.log('  Citizen: citizen@example.com / citizen123');
}

runTests().catch(console.error);
