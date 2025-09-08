#!/usr/bin/env node

// Update production demo account for ARIA5 platform
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

async function updateProductionDemo() {
  console.log('🔧 Updating production demo accounts...');
  
  try {
    // Generate password hash for 'demo123'
    const password = 'demo123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Password hash generated');
    console.log('Hash:', passwordHash);
    
    // Update admin account password in production
    const updateAdminQuery = `UPDATE users SET password_hash = '${passwordHash}', updated_at = datetime('now') WHERE username = 'admin';`;
    
    console.log('🔄 Updating admin account in production...');
    execSync(`npx wrangler d1 execute aria51-production --remote --command="${updateAdminQuery}"`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Admin account password updated in production');
    
    // Try to create demo account (it might already exist)
    const insertDemoQuery = `
      INSERT OR REPLACE INTO users (
        username, 
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        is_active, 
        organization_id,
        created_at,
        updated_at
      ) VALUES (
        'demo', 
        'demo@aria5.local', 
        '${passwordHash}', 
        'Demo', 
        'User', 
        'admin', 
        1, 
        1,
        datetime('now'),
        datetime('now')
      );
    `;
    
    console.log('🔄 Creating/updating demo account in production...');
    execSync(`npx wrangler d1 execute aria51-production --remote --command="${insertDemoQuery}"`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Demo account created/updated in production');
    
    // Verify accounts
    console.log('🔍 Verifying accounts...');
    const verifyQuery = `SELECT username, first_name, role, is_active FROM users WHERE username IN ('demo', 'admin');`;
    execSync(`npx wrangler d1 execute aria51-production --remote --command="${verifyQuery}"`, {
      stdio: 'inherit'
    });
    
    console.log('\n🎉 Production demo accounts updated successfully!');
    console.log('📋 Available demo credentials for production:');
    console.log('   Username: demo     | Password: demo123 | Role: admin');
    console.log('   Username: admin    | Password: demo123 | Role: admin');
    console.log('\n🔗 Login URL: https://2dcae877.aria5-ti-enhancement.pages.dev/login');
    
  } catch (error) {
    console.error('❌ Error updating production demo accounts:', error);
    process.exit(1);
  }
}

updateProductionDemo();