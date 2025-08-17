#!/usr/bin/env node

// DMT Risk Platform - User Export Script
// Exports existing users from D1 database for Keycloak migration

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function executeD1Query(query) {
  return new Promise((resolve, reject) => {
    const wrangler = spawn('npx', [
      'wrangler', 'd1', 'execute', 'dmt-production',
      '--local', '--command', query
    ]);

    let stdout = '';
    let stderr = '';

    wrangler.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    wrangler.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    wrangler.on('close', (code) => {
      if (code === 0) {
        try {
          // Extract the JSON array from wrangler output
          const jsonStart = stdout.indexOf('[');
          const jsonEnd = stdout.lastIndexOf(']') + 1;
          
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonStr = stdout.substring(jsonStart, jsonEnd);
            const result = JSON.parse(jsonStr);
            resolve(result[0]?.results || []);
          } else {
            console.log('No JSON found in output');
            resolve([]);
          }
        } catch (error) {
          console.error('Parse error:', error.message);
          resolve([]);
        }
      } else {
        reject(new Error(`D1 query failed: ${stderr}`));
      }
    });
  });
}

async function exportUsers() {
  console.log('📤 Exporting users from D1 database...');
  
  try {
    // Get all users from the database
    const users = await executeD1Query(`
      SELECT 
        id, username, email, first_name, last_name, 
        department, job_title, phone, role, is_active,
        created_at, updated_at
      FROM users 
      ORDER BY id
    `);

    console.log(`📊 Found ${users.length} users to export`);

    // Transform users to Keycloak format
    const keycloakUsers = users.map(user => {
      const roles = [user.role];
      
      // Map department to groups
      const groups = [];
      if (user.role === 'admin') groups.push('/Administrators');
      else if (user.role === 'risk_manager') groups.push('/Risk Managers');
      else if (user.role === 'compliance_officer') groups.push('/Compliance Officers');
      else if (user.role === 'auditor') groups.push('/Auditors');

      return {
        username: user.username,
        email: user.email,
        emailVerified: true,
        firstName: user.first_name || user.username,
        lastName: user.last_name || '',
        enabled: user.is_active === 1,
        credentials: [
          {
            type: 'password',
            value: 'demo123', // Default password, users should change on first login
            temporary: true
          }
        ],
        attributes: {
          department: [user.department || ''],
          jobTitle: [user.job_title || ''],
          phone: [user.phone || ''],
          originalUserId: [user.id.toString()],
          migratedAt: [new Date().toISOString()]
        },
        realmRoles: roles,
        groups: groups,
        createdTimestamp: new Date(user.created_at).getTime()
      };
    });

    // Create export directory
    const exportDir = path.join(process.cwd(), 'keycloak', 'export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Save users export
    const usersExport = {
      users: keycloakUsers,
      exportTimestamp: new Date().toISOString(),
      totalUsers: keycloakUsers.length
    };

    fs.writeFileSync(
      path.join(exportDir, 'users-export.json'),
      JSON.stringify(usersExport, null, 2)
    );

    // Create Keycloak import format
    const keycloakImport = {
      realm: 'dmt-risk-platform',
      users: keycloakUsers
    };

    fs.writeFileSync(
      path.join(exportDir, 'keycloak-users-import.json'),
      JSON.stringify(keycloakImport, null, 2)
    );

    // Create user mapping file for reference
    const userMapping = users.map(user => ({
      originalId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department
    }));

    fs.writeFileSync(
      path.join(exportDir, 'user-mapping.json'),
      JSON.stringify(userMapping, null, 2)
    );

    console.log('✅ User export completed!');
    console.log(`📁 Files created in: ${exportDir}/`);
    console.log('   - users-export.json (detailed export)');
    console.log('   - keycloak-users-import.json (Keycloak import format)');
    console.log('   - user-mapping.json (ID mapping reference)');
    console.log('');
    console.log('👥 User Summary:');
    
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });

  } catch (error) {
    console.error('❌ Error exporting users:', error.message);
    process.exit(1);
  }
}

// Run the export
if (require.main === module) {
  exportUsers().catch(console.error);
}

module.exports = { exportUsers };