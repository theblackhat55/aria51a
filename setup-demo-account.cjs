#!/usr/bin/env node

// Setup demo account for ARIA5 platform
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

async function setupDemoAccount() {
  console.log('🔧 Setting up demo account...');
  
  try {
    // Generate password hash for 'demo123'
    const password = 'demo123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Password hash generated');
    
    // Create or update demo account
    const insertQuery = `
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
    
    // Execute query
    execSync(`npx wrangler d1 execute aria52-production --local --command="${insertQuery}"`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Demo account created/updated');
    
    // Also ensure Admin account has demo123 password for backward compatibility
    const adminPasswordHash = await bcrypt.hash('demo123', saltRounds);
    const updateAdminQuery = `
      UPDATE users 
      SET password_hash = '${adminPasswordHash}', 
          updated_at = datetime('now')
      WHERE username = 'admin';
    `;
    
    execSync(`npx wrangler d1 execute aria52-production --local --command="${updateAdminQuery}"`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Admin account password updated');
    
    // Verify accounts
    const verifyQuery = `SELECT username, first_name, role FROM users WHERE username IN ('demo', 'admin');`;
    execSync(`npx wrangler d1 execute aria52-production --local --command="${verifyQuery}"`, {
      stdio: 'inherit'
    });
    
    console.log('\n🎉 Demo accounts setup completed!');
    console.log('📋 Available demo credentials:');
    console.log('   Username: demo     | Password: demo123 | Role: admin');
    console.log('   Username: admin    | Password: demo123 | Role: admin');
    console.log('\n🔗 Login URL: https://8ac139c7.aria5-ti-enhancement.pages.dev/login');
    
  } catch (error) {
    console.error('❌ Error setting up demo account:', error);
    process.exit(1);
  }
}

setupDemoAccount();