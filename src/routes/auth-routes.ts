import { Hono } from 'hono';
import { html } from 'hono/html';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// Simple base64 encoding for demo - in production use proper JWT library
const JWT_SECRET = 'aria5-htmx-secret-key';

export function createAuthRoutes() {
  const app = new Hono();
  
  // Login endpoint - returns HTMX partial or redirect
  app.post('/login', async (c) => {
    try {
      const { username, password } = await c.req.parseBody();
      
      // Demo user accounts (in production, query from database)
      const demoUsers: any = {
        'admin': { 
          id: 1, 
          username: 'admin', 
          email: 'admin@aria5.com', 
          password: 'demo123',
          role: 'admin', 
          firstName: 'Admin', 
          lastName: 'User' 
        },
        'avi_security': { 
          id: 2, 
          username: 'avi_security', 
          email: 'avi@aria5.com', 
          password: 'demo123',
          role: 'risk_manager', 
          firstName: 'Avi', 
          lastName: 'Security' 
        },
        'sjohnson': { 
          id: 3, 
          username: 'sjohnson', 
          email: 'sjohnson@aria5.com', 
          password: 'demo123',
          role: 'compliance_officer', 
          firstName: 'Sarah', 
          lastName: 'Johnson' 
        }
      };
      
      const user = demoUsers[String(username)];
      
      if (!user || user.password !== String(password)) {
        return c.html(renderError('Invalid username or password'), 401);
      }
      
      // Create simple token (in production use proper JWT)
      const tokenData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };
      
      const token = btoa(JSON.stringify(tokenData));
      
      // Set cookie
      setCookie(c, 'aria_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 86400, // 24 hours
        path: '/'
      });
      
      // Return success with redirect
      c.header('HX-Redirect', '/dashboard');
      return c.html(renderSuccess('Login successful! Redirecting...'));
      
    } catch (error) {
      console.error('Login error:', error);
      return c.html(renderError('An error occurred during login'), 500);
    }
  });
  
  // Logout endpoint
  app.post('/logout', async (c) => {
    deleteCookie(c, 'aria_token', { path: '/' });
    c.header('HX-Redirect', '/login');
    return c.html(renderSuccess('Logged out successfully'));
  });
  
  // Check authentication status
  app.get('/check', async (c) => {
    const token = getCookie(c, 'aria_token');
    
    if (!token) {
      return c.json({ authenticated: false }, 401);
    }
    
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.exp < Date.now()) {
        return c.json({ authenticated: false }, 401);
      }
      return c.json({ 
        authenticated: true, 
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          email: decoded.email
        }
      });
    } catch (error) {
      return c.json({ authenticated: false }, 401);
    }
  });
  
  // Password reset request
  app.post('/reset-password', async (c) => {
    const { email } = await c.req.parseBody();
    
    // In production, send email with reset link
    // For now, just return success message
    return c.html(renderSuccess(`Password reset link sent to ${email}`));
  });
  
  return app;
}

// Helper functions for rendering HTMX partials
const renderError = (message: string) => html`
  <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
    <div class="flex">
      <div class="flex-shrink-0">
        <i class="fas fa-exclamation-circle text-red-500"></i>
      </div>
      <div class="ml-3">
        <p class="text-sm text-red-700">${message}</p>
      </div>
    </div>
  </div>
`;

const renderSuccess = (message: string) => html`
  <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4" role="alert">
    <div class="flex">
      <div class="flex-shrink-0">
        <i class="fas fa-check-circle text-green-500"></i>
      </div>
      <div class="ml-3">
        <p class="text-sm text-green-700">${message}</p>
      </div>
    </div>
  </div>
`;

// Middleware to check authentication
export const requireAuth = async (c: any, next: any) => {
  const token = getCookie(c, 'aria_token');
  
  if (!token) {
    return c.redirect('/login');
  }
  
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.exp < Date.now()) {
      deleteCookie(c, 'aria_token');
      return c.redirect('/login');
    }
    c.set('user', decoded);
    await next();
  } catch (error) {
    deleteCookie(c, 'aria_token');
    return c.redirect('/login');
  }
};

// Middleware to require admin role
export const requireAdmin = async (c: any, next: any) => {
  const user = c.get('user');
  
  if (!user || user.role !== 'admin') {
    return c.html(renderError('Unauthorized: Admin access required'), 403);
  }
  
  await next();
};