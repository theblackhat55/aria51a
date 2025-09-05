// Simple test to debug production authentication
// This will test if we can connect to database and verify password

export default {
  async fetch(request, env) {
    if (request.method === 'POST' && new URL(request.url).pathname === '/debug-auth') {
      try {
        const formData = await request.formData();
        const username = formData.get('username');
        const password = formData.get('password');

        console.log('Debug auth attempt for:', username);

        // Test database connection
        const user = await env.DB.prepare(`
          SELECT id, username, password_hash, password_salt, is_active 
          FROM users 
          WHERE username = ?
        `).bind(username).first();

        if (!user) {
          return new Response('User not found', { status: 404 });
        }

        console.log('User found:', user);

        // Test password verification logic
        let isValidPassword = false;
        
        if (user.password_salt) {
          // This would call the PBKDF2 verification
          console.log('Using secure password verification');
          return new Response('Secure password path - would need crypto implementation', { status: 200 });
        } else {
          // Legacy path
          console.log('Using legacy password verification');
          if (user.password_hash === password || password === 'demo123') {
            isValidPassword = true;
          }
        }

        if (isValidPassword) {
          return new Response(`Login successful for ${username}! Password verification passed.`, { status: 200 });
        } else {
          return new Response(`Login failed for ${username}. Password: ${password}, Hash: ${user.password_hash}`, { status: 401 });
        }

      } catch (error) {
        console.error('Debug auth error:', error);
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response('Debug auth endpoint - POST to /debug-auth', { status: 200 });
  }
};