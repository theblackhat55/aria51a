// ARIA5.1 - Production Security Middleware
import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { verifyJWT } from '../lib/security';

// JWT secret from environment or fallback
function getJWTSecret(env: any): string {
  return env?.JWT_SECRET || 'aria5-production-jwt-secret-2024-change-in-production-32-chars-minimum';
}

// Authentication middleware
export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'aria_token');
  
  // Check if this is an HTMX request
  const isHTMXRequest = c.req.header('hx-request') === 'true';
  
  if (!token) {
    if (isHTMXRequest) {
      // Return error modal for HTMX requests
      return c.html(`
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div class="sm:flex sm:items-start">
                    <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <i class="fas fa-exclamation-triangle text-red-600"></i>
                    </div>
                    <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 class="text-lg font-semibold leading-6 text-gray-900">Authentication Required</h3>
                      <div class="mt-2">
                        <p class="text-sm text-gray-500">Your session has expired. Please log in again.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button onclick="window.location.href='/login'" 
                          class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto">
                    Go to Login
                  </button>
                  <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                          class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    }
    return c.redirect('/login');
  }

  try {
    const secret = getJWTSecret(c.env);
    const payload = await verifyJWT(token, secret);
    
    if (!payload || !payload.id) {
      if (isHTMXRequest) {
        return c.html(`
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
            <div class="fixed inset-0 z-50 overflow-y-auto">
              <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                  <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                      <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <i class="fas fa-exclamation-triangle text-red-600"></i>
                      </div>
                      <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <h3 class="text-lg font-semibold leading-6 text-gray-900">Invalid Session</h3>
                        <div class="mt-2">
                          <p class="text-sm text-gray-500">Your session is invalid. Please log in again.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button onclick="window.location.href='/login'" 
                            class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto">
                      Go to Login
                    </button>
                    <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `);
      }
      return c.redirect('/login');
    }

    // Get user from database
    const user = await c.env.DB.prepare(`
      SELECT id, username, email, first_name, last_name, role, is_active
      FROM users 
      WHERE id = ? AND is_active = 1
    `).bind(payload.id).first();

    if (!user) {
      if (isHTMXRequest) {
        return c.html(`
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
            <div class="fixed inset-0 z-50 overflow-y-auto">
              <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                  <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                      <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <i class="fas fa-user-slash text-red-600"></i>
                      </div>
                      <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <h3 class="text-lg font-semibold leading-6 text-gray-900">User Not Found</h3>
                        <div class="mt-2">
                          <p class="text-sm text-gray-500">Your user account is inactive or not found.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button onclick="window.location.href='/login'" 
                            class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto">
                      Go to Login
                    </button>
                    <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `);
      }
      return c.redirect('/login');
    }

    // Set user context
    c.set('user', user);
    // Set organizationId for easy access in DDD routes
    c.set('organizationId', user.organization_id);
    // Set userId for easy access in DDD routes  
    c.set('userId', user.id);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (isHTMXRequest) {
      return c.html(`
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div class="sm:flex sm:items-start">
                    <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <i class="fas fa-exclamation-circle text-red-600"></i>
                    </div>
                    <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 class="text-lg font-semibold leading-6 text-gray-900">Authentication Error</h3>
                      <div class="mt-2">
                        <p class="text-sm text-gray-500">An error occurred during authentication. Please try again.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button onclick="window.location.href='/login'" 
                          class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto">
                    Go to Login
                  </button>
                  <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                          class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    }
    return c.redirect('/login');
  }
}

// Role-based access control
export function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    await next();
  };
}

// Admin-only access
export async function requireAdmin(c: Context, next: Next) {
  const user = c.get('user');
  
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  await next();
}

// CSRF protection middleware
export async function csrfMiddleware(c: Context, next: Next) {
  const method = c.req.method.toUpperCase();
  
  // Only check CSRF for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const token = c.req.header('X-CSRF-Token') || 
                  (await c.req.parseBody())?.csrf_token as string;
    
    const sessionToken = getCookie(c, 'csrf_token');
    
    if (!token || !sessionToken || token !== sessionToken) {
      return c.json({ error: 'CSRF token mismatch' }, 403);
    }
  }
  
  await next();
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Set CSRF token in cookie and return for forms
export function setCSRFToken(c: Context): string {
  const token = generateCSRFToken();
  
  setCookie(c, 'csrf_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 3600 // 1 hour
  });
  
  return token;
}