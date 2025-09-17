// Test script to access risk-controls page with authentication
const baseUrl = 'http://localhost:3000';

async function testRiskControlsPage() {
  try {
    console.log('🧪 Testing Risk Controls page...');
    
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'admin', 
        password: 'admin123' 
      })
    });
    
    const loginCookies = loginResponse.headers.get('set-cookie');
    console.log('Login response status:', loginResponse.status);
    console.log('Login cookies:', loginCookies ? 'Present' : 'Missing');
    
    if (loginResponse.status !== 200 && loginResponse.status !== 302) {
      const loginText = await loginResponse.text();
      console.log('Login response:', loginText);
      throw new Error('Login failed: ' + loginResponse.status);
    }
    
    // Step 2: Access risk-controls page
    console.log('2. Accessing /risk-controls page...');
    const riskControlsResponse = await fetch(`${baseUrl}/risk-controls`, {
      headers: {
        'Cookie': loginCookies || ''
      }
    });
    
    console.log('Risk Controls response status:', riskControlsResponse.status);
    
    if (riskControlsResponse.status === 500) {
      const errorText = await riskControlsResponse.text();
      console.log('❌ 500 Error response:', errorText);
      return false;
    } else if (riskControlsResponse.status === 200) {
      console.log('✅ Risk Controls page loaded successfully!');
      const pageContent = await riskControlsResponse.text();
      console.log('Page contains "Risk-Control Mapping":', pageContent.includes('Risk-Control Mapping'));
      return true;
    } else if (riskControlsResponse.status === 302) {
      const location = riskControlsResponse.headers.get('location');
      console.log('⚠️  Redirected to:', location);
      return false;
    } else {
      console.log('❓ Unexpected status:', riskControlsResponse.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

testRiskControlsPage().then(success => {
  console.log(success ? '✅ Test passed!' : '❌ Test failed!');
  process.exit(success ? 0 : 1);
});