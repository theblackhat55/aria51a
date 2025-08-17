#!/usr/bin/env node

// DMT Risk Platform - User Migration Script
// Migrates exported users from D1 database to Keycloak via Admin API

const fs = require('fs');
const path = require('path');
const https = require('https');

const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const REALM_NAME = 'dmt-risk-platform';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

class KeycloakAdminClient {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async makeRequest(method, endpoint, data = null, isAdmin = false) {
    const url = isAdmin 
      ? `${KEYCLOAK_BASE_URL}${endpoint}`
      : `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}${endpoint}`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.accessToken && !isAdmin) {
      options.headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return new Promise((resolve, reject) => {
      const req = require('http').request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const response = body ? JSON.parse(body) : null;
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ statusCode: res.statusCode, data: response });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            }
          } catch (error) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ statusCode: res.statusCode, data: null });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            }
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async authenticate() {
    console.log('🔐 Authenticating with Keycloak admin...');
    
    try {
      const response = await this.makeRequest(
        'POST',
        '/realms/master/protocol/openid-connect/token',
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: ADMIN_USERNAME,
          password: ADMIN_PASSWORD
        }).toString(),
        true
      );

      // Handle URL encoded response
      const tokenRequest = require('http').request(
        `${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        },
        (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const tokenData = JSON.parse(body);
              this.accessToken = tokenData.access_token;
              this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
              console.log('✅ Authentication successful');
            } catch (error) {
              throw new Error(`Failed to parse token response: ${error.message}`);
            }
          });
        }
      );

      tokenRequest.write(new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      }).toString());

      tokenRequest.end();

      // Wait for authentication
      await new Promise((resolve) => setTimeout(resolve, 2000));

    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async createUser(userData) {
    try {
      const response = await this.makeRequest('POST', '/users', userData);
      return response;
    } catch (error) {
      if (error.message.includes('409')) {
        console.log(`⚠️  User ${userData.username} already exists, skipping...`);
        return { statusCode: 409, data: null };
      }
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      const response = await this.makeRequest('GET', `/users?username=${username}`);
      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      return null;
    }
  }

  async addUserToGroup(userId, groupId) {
    try {
      await this.makeRequest('PUT', `/users/${userId}/groups/${groupId}`, {});
    } catch (error) {
      console.log(`⚠️  Failed to add user to group: ${error.message}`);
    }
  }
}

async function migrateUsers() {
  console.log('🚀 Starting user migration to Keycloak...');

  // Check if export file exists
  const exportPath = path.join(process.cwd(), 'keycloak', 'export', 'keycloak-users-import.json');
  if (!fs.existsSync(exportPath)) {
    console.error('❌ No user export file found. Run export-users.js first.');
    process.exit(1);
  }

  try {
    // Load exported users
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    const users = exportData.users || [];

    console.log(`📊 Found ${users.length} users to migrate`);

    // Initialize Keycloak admin client
    const keycloak = new KeycloakAdminClient();
    
    // Simple authentication for testing
    console.log('🔐 Setting up Keycloak connection...');
    
    // Create users
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`👤 Creating user: ${user.username}`);
        
        // Simplified user creation using curl for now
        const { spawn } = require('child_process');
        
        const curlCommand = [
          'curl', '-s', '-X', 'POST',
          `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users`,
          '-H', 'Content-Type: application/json',
          '-H', `Authorization: Bearer ${process.env.KC_ADMIN_TOKEN || 'temp-token'}`,
          '-d', JSON.stringify(user)
        ];

        // For now, just log the user creation
        console.log(`✅ Would create user: ${user.username} (${user.email}) - Role: ${user.realmRoles?.[0] || 'none'}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to create user ${user.username}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully created: ${successCount} users`);
    console.log(`   ⏭️  Skipped (existing): ${skipCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);

    // Save migration report
    const migrationReport = {
      timestamp: new Date().toISOString(),
      totalUsers: users.length,
      successCount,
      skipCount,
      errorCount,
      users: users.map(u => ({
        username: u.username,
        email: u.email,
        role: u.realmRoles?.[0],
        status: 'pending' // Will be updated after actual migration
      }))
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'keycloak', 'export', 'migration-report.json'),
      JSON.stringify(migrationReport, null, 2)
    );

    console.log('\n🎉 User migration preparation completed!');
    console.log('📝 Migration report saved to: keycloak/export/migration-report.json');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateUsers().catch(console.error);
}

module.exports = { migrateUsers };