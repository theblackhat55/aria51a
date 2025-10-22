# Core Middleware Documentation

This directory contains the core middleware components for the ARIA5 application.

## Available Middleware

### 1. AuthMiddleware
**Purpose**: Handle authentication and authorization for protected routes.

**Features**:
- JWT/Session token validation
- Role-based access control (RBAC)
- Permission-based access control
- Support for cookie and header-based authentication

**Usage**:
```typescript
import { Hono } from 'hono';
import { authMiddleware } from '../core';

const app = new Hono();

// Require authentication for all /api routes
app.use('/api/*', authMiddleware({ 
  secretKey: 'your-secret-key' 
}));

// Require admin role
app.use('/admin/*', authMiddleware({ 
  secretKey: 'your-secret-key',
  requiredRoles: ['admin'] 
}));

// Require specific permissions
app.use('/api/users/delete', authMiddleware({ 
  secretKey: 'your-secret-key',
  requiredPermissions: ['users:delete'] 
}));

// Allow public access (authentication optional)
app.use('/api/public/*', authMiddleware({ 
  secretKey: 'your-secret-key',
  allowPublic: true 
}));
```

**Accessing User in Handlers**:
```typescript
import { getCurrentUser, hasRole, hasPermission } from '../core';

app.get('/api/profile', async (c) => {
  const user = getCurrentUser(c);
  return c.json({ user });
});

app.post('/api/admin/action', async (c) => {
  if (!hasRole(c, 'admin')) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  // Admin action
});
```

---

### 2. ErrorHandlerMiddleware
**Purpose**: Global error handling and consistent error responses.

**Features**:
- Catches all unhandled errors
- Consistent error response format
- Development vs production stack traces
- Custom error handlers for specific error types
- Integration with domain exceptions

**Usage**:
```typescript
import { Hono } from 'hono';
import { errorHandler, asyncHandler } from '../core';

const app = new Hono();

// Apply error handler globally
app.use('*', errorHandler({
  includeStackTrace: process.env.NODE_ENV === 'development',
  logToConsole: true
}));

// Use asyncHandler for route handlers
app.get('/api/users', asyncHandler(async (c) => {
  const users = await userService.getAll(); // Errors auto-caught
  return c.json(users);
}));

// Custom error handlers
const customHandlers = new Map();
customHandlers.set('DatabaseError', async (error, c) => {
  return c.json({ error: 'Database unavailable' }, 503);
});

app.use('*', errorHandler({ customHandlers }));
```

**Error Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { "field": "email", "message": "Invalid email" }
  },
  "timestamp": "2025-10-22T10:30:00.000Z"
}
```

---

### 3. ValidationMiddleware
**Purpose**: Validate request data against schemas.

**Features**:
- Type validation (string, number, boolean, array, object, email, url, uuid, date)
- Constraint validation (min, max, pattern, enum, custom)
- Nested object/array validation
- Field-specific error messages
- Strip unknown fields

**Usage**:
```typescript
import { Hono } from 'hono';
import { validate, getValidatedData, ValidationSchema } from '../core';

const app = new Hono();

// Define validation schema
const createUserSchema: ValidationSchema = {
  email: { 
    type: 'email', 
    required: true,
    message: 'Valid email is required'
  },
  name: { 
    type: 'string', 
    required: true, 
    min: 2, 
    max: 100 
  },
  age: { 
    type: 'number', 
    min: 18, 
    max: 120 
  },
  role: { 
    type: 'string', 
    enum: ['user', 'admin', 'moderator'] 
  },
  password: {
    type: 'string',
    required: true,
    min: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must contain uppercase, lowercase, and number'
  }
};

// Apply validation middleware
app.post('/api/users', 
  validate({ schema: createUserSchema, source: 'body' }), 
  async (c) => {
    const data = getValidatedData(c); // Type-safe validated data
    const user = await userService.create(data);
    return c.json(user);
  }
);

// Validate query parameters
const searchSchema: ValidationSchema = {
  query: { type: 'string', required: true, min: 3 },
  page: { type: 'number', min: 1 },
  limit: { type: 'number', min: 1, max: 100 }
};

app.get('/api/search', 
  validate({ schema: searchSchema, source: 'query' }), 
  async (c) => {
    const { query, page, limit } = getValidatedData(c);
    // Perform search
  }
);
```

**Nested Validation**:
```typescript
const addressSchema: ValidationSchema = {
  address: {
    type: 'object',
    required: true,
    schema: {
      street: { type: 'string', required: true },
      city: { type: 'string', required: true },
      zipCode: { type: 'string', pattern: /^\d{5}$/ }
    }
  }
};
```

**Custom Validation**:
```typescript
const schema: ValidationSchema = {
  username: {
    type: 'string',
    required: true,
    custom: (value) => {
      if (value.includes(' ')) {
        return 'Username cannot contain spaces';
      }
      return true;
    }
  }
};
```

---

### 4. RateLimitMiddleware
**Purpose**: Prevent abuse by limiting request rates.

**Features**:
- Configurable rate limits (max requests per time window)
- Multiple storage backends (in-memory, Cloudflare D1)
- Custom key generators (IP, user ID, API key)
- Standard rate limit headers
- Preset configurations for common use cases

**Usage**:
```typescript
import { Hono } from 'hono';
import { rateLimit, RateLimitPresets, userIdKeyGenerator } from '../core';

const app = new Hono();

// Basic rate limiting (100 requests per 15 minutes)
app.use('/api/*', rateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000
}));

// Use presets
app.post('/api/login', rateLimit(RateLimitPresets.auth));
app.use('/api/public/*', rateLimit(RateLimitPresets.public));

// Rate limit per user (after authentication)
app.use('/api/user/*', rateLimit({
  maxRequests: 1000,
  windowMs: 60 * 60 * 1000,
  keyGenerator: userIdKeyGenerator()
}));

// Custom rate limit with message
app.post('/api/expensive-operation', rateLimit({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Rate limit exceeded. This operation is limited to 10 per hour.'
}));
```

**Cloudflare D1 Storage**:
```typescript
import { createD1RateLimitStore } from '../core';

// First, create the rate_limits table:
// CREATE TABLE rate_limits (
//   key TEXT PRIMARY KEY,
//   count INTEGER,
//   reset_time INTEGER
// );

const d1Store = createD1RateLimitStore(env.DB, 15 * 60 * 1000);

app.use('/api/*', rateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
  store: d1Store
}));
```

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-10-22T11:00:00.000Z
Retry-After: 900
```

---

## Complete Example

Here's a complete example combining all middleware:

```typescript
import { Hono } from 'hono';
import { 
  errorHandler, 
  authMiddleware, 
  validate, 
  rateLimit,
  RateLimitPresets,
  ValidationSchema,
  getValidatedData,
  getCurrentUser 
} from './core';

const app = new Hono();

// 1. Global error handler (first)
app.use('*', errorHandler({
  includeStackTrace: process.env.NODE_ENV === 'development'
}));

// 2. Rate limiting for all API routes
app.use('/api/*', rateLimit({
  maxRequests: 1000,
  windowMs: 15 * 60 * 1000
}));

// 3. Strict rate limiting for auth routes
app.post('/api/login', rateLimit(RateLimitPresets.auth));
app.post('/api/register', rateLimit(RateLimitPresets.auth));

// 4. Public routes (no auth required)
app.get('/api/public/status', (c) => c.json({ status: 'ok' }));

// 5. Protected routes (authentication required)
app.use('/api/protected/*', authMiddleware({ 
  secretKey: process.env.JWT_SECRET! 
}));

// 6. Route with validation
const createRiskSchema: ValidationSchema = {
  title: { type: 'string', required: true, min: 5, max: 200 },
  description: { type: 'string', required: true, min: 10 },
  severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
  probability: { type: 'number', min: 0, max: 1 }
};

app.post('/api/protected/risks',
  validate({ schema: createRiskSchema, source: 'body' }),
  async (c) => {
    const user = getCurrentUser(c);
    const data = getValidatedData(c);
    
    // Create risk with validated data
    const risk = await riskService.create({
      ...data,
      createdBy: user?.id
    });
    
    return c.json(risk, 201);
  }
);

// 7. Admin-only routes
app.use('/api/admin/*', authMiddleware({ 
  secretKey: process.env.JWT_SECRET!,
  requiredRoles: ['admin'] 
}));

app.delete('/api/admin/users/:id', async (c) => {
  const userId = c.req.param('id');
  await userService.delete(userId);
  return c.json({ success: true });
});

export default app;
```

---

## Middleware Execution Order

**IMPORTANT**: Middleware order matters!

1. **Error Handler** - Should be first to catch all errors
2. **Rate Limiting** - Limit requests early
3. **Authentication** - Verify user identity
4. **Validation** - Validate request data
5. **Route Handlers** - Your business logic

```typescript
// ✅ CORRECT ORDER
app.use('*', errorHandler());          // 1. Catch all errors
app.use('/api/*', rateLimit(...));     // 2. Rate limiting
app.use('/api/*', authMiddleware(...)); // 3. Authentication
app.post('/api/users', validate(...)); // 4. Validation
app.post('/api/users', handler);       // 5. Business logic

// ❌ WRONG ORDER
app.use('/api/*', authMiddleware(...)); // ❌ Errors won't be caught
app.use('*', errorHandler());          // ❌ Too late
```

---

## Best Practices

### 1. Error Handling
- Always use `errorHandler()` as the first middleware
- Use `asyncHandler()` for async route handlers
- Throw domain exceptions for business logic errors

### 2. Authentication
- Store JWT secret in environment variables
- Use different secrets for different environments
- Implement token refresh mechanism
- Use short-lived access tokens

### 3. Validation
- Define schemas at module level (reusable)
- Use custom validation for complex rules
- Provide clear error messages
- Validate all user input

### 4. Rate Limiting
- Use stricter limits for auth endpoints
- Use D1 storage for distributed deployments
- Use user-based limiting for authenticated routes
- Set appropriate retry-after headers

### 5. Performance
- Use in-memory storage for rate limiting in dev
- Use D1 storage for production
- Set appropriate time windows
- Monitor rate limit hit rates

---

## Testing Middleware

```typescript
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware, validate } from '../core';

describe('Middleware Tests', () => {
  it('should reject unauthenticated requests', async () => {
    const app = new Hono();
    app.use('*', authMiddleware({ secretKey: 'test' }));
    app.get('/', (c) => c.json({ success: true }));
    
    const res = await app.request('/');
    expect(res.status).toBe(401);
  });
  
  it('should validate request data', async () => {
    const app = new Hono();
    const schema = { email: { type: 'email', required: true } };
    app.post('/', validate({ schema }), (c) => c.json({ success: true }));
    
    const res = await app.request('/', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid' }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(res.status).toBe(400);
  });
});
```

---

## Migration Guide

To migrate existing routes to use core middleware:

### Before:
```typescript
app.post('/api/users', async (c) => {
  // Manual validation
  const body = await c.req.json();
  if (!body.email || !body.name) {
    return c.json({ error: 'Missing fields' }, 400);
  }
  
  // Create user
  const user = await userService.create(body);
  return c.json(user);
});
```

### After:
```typescript
import { validate, getValidatedData } from './core';

const schema: ValidationSchema = {
  email: { type: 'email', required: true },
  name: { type: 'string', required: true, min: 2 }
};

app.post('/api/users',
  validate({ schema }),
  async (c) => {
    const data = getValidatedData(c);
    const user = await userService.create(data);
    return c.json(user);
  }
);
```

---

**Last Updated**: October 22, 2025  
**Author**: Security Specialist  
**Status**: Production Ready
