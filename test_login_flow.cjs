// Simulate the complete login flow
const axios = require('axios');

async function testLoginFlow() {
    console.log('🧪 Testing complete login flow...\n');
    
    const baseURL = 'http://localhost:3000';
    
    console.log('1. Testing login API...');
    try {
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            username: 'admin',
            password: 'demo123'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login API successful');
            console.log('   User:', loginResponse.data.data.user.first_name, loginResponse.data.data.user.last_name);
            console.log('   Role:', loginResponse.data.data.user.role);
            console.log('   Token:', loginResponse.data.data.token.substring(0, 30) + '...');
            
            const token = loginResponse.data.data.token;
            
            console.log('\n2. Testing token validation...');
            try {
                const authResponse = await axios.get(`${baseURL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (authResponse.data.success) {
                    console.log('✅ Token validation successful');
                    console.log('   Validated user:', authResponse.data.data.first_name, authResponse.data.data.last_name);
                    
                    console.log('\n3. Testing dashboard API...');
                    try {
                        const dashboardResponse = await axios.get(`${baseURL}/api/dashboard`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        if (dashboardResponse.data.success) {
                            console.log('✅ Dashboard API successful');
                            console.log('   Total risks:', dashboardResponse.data.data.total_risks);
                            console.log('   High risks:', dashboardResponse.data.data.high_risks);
                            console.log('   Compliance score:', dashboardResponse.data.data.compliance_score + '%');
                        } else {
                            console.log('❌ Dashboard API failed:', dashboardResponse.data.error);
                        }
                    } catch (dashError) {
                        console.log('❌ Dashboard API error:', dashError.message);
                    }
                    
                } else {
                    console.log('❌ Token validation failed:', authResponse.data.error);
                }
            } catch (authError) {
                console.log('❌ Token validation error:', authError.message);
            }
            
        } else {
            console.log('❌ Login API failed:', loginResponse.data.error);
        }
    } catch (loginError) {
        console.log('❌ Login API error:', loginError.message);
    }
}

testLoginFlow();
