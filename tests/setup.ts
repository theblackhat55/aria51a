// Global test setup for ARIA5.1 Enterprise Security Intelligence Platform
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// Mock Cloudflare Workers environment
declare global {
  interface CloudflareEnv {
    DB: any
    KV: any
    R2: any
    JWT_SECRET?: string
    OPENAI_API_KEY?: string
    ANTHROPIC_API_KEY?: string
  }
}

// Mock environment for testing
const mockEnv: CloudflareEnv = {
  DB: {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        all: () => Promise.resolve({ results: [], meta: {} }),
        run: () => Promise.resolve({ meta: { last_row_id: 1, changes: 1 } }),
        first: () => Promise.resolve(null)
      }),
      all: () => Promise.resolve({ results: [], meta: {} }),
      run: () => Promise.resolve({ meta: { last_row_id: 1, changes: 1 } }),
      first: () => Promise.resolve(null)
    }),
    exec: () => Promise.resolve({ results: [], meta: {} }),
    dump: () => Promise.resolve(new ArrayBuffer(0)),
    batch: () => Promise.resolve([])
  },
  KV: {
    get: () => Promise.resolve(null),
    put: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    list: () => Promise.resolve({ keys: [], list_complete: true })
  },
  R2: {
    get: () => Promise.resolve(null),
    put: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    list: () => Promise.resolve({ objects: [], truncated: false })
  },
  JWT_SECRET: 'test_jwt_secret_key_for_testing_only',
  OPENAI_API_KEY: 'test_openai_key',
  ANTHROPIC_API_KEY: 'test_anthropic_key'
}

// Global test configuration
beforeAll(async () => {
  // Set up global test environment
  console.log('🧪 Starting ARIA5.1 Test Suite')
  
  // Mock global fetch if needed
  if (!globalThis.fetch) {
    globalThis.fetch = async () => new Response('{}', { status: 200 })
  }
  
  // Mock crypto if needed for JWT
  if (!globalThis.crypto) {
    const { webcrypto } = await import('crypto')
    globalThis.crypto = webcrypto as any
  }
})

afterAll(async () => {
  console.log('🧪 ARIA5.1 Test Suite Completed')
})

beforeEach(async () => {
  // Reset mocks before each test
  // This ensures clean state between tests
})

afterEach(async () => {
  // Cleanup after each test if needed
})

// Export mock environment for tests
export { mockEnv }

// Utility functions for tests
export const createMockRequest = (
  url: string,
  options: RequestInit = {}
): Request => {
  return new Request(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
}

export const createMockContext = (env = mockEnv) => ({
  env,
  req: createMockRequest('http://localhost:3000/test'),
  text: () => Promise.resolve(''),
  json: () => Promise.resolve({}),
  html: (content: string) => new Response(content, {
    headers: { 'Content-Type': 'text/html' }
  }),
  redirect: (location: string) => new Response(null, {
    status: 302,
    headers: { Location: location }
  }),
  status: (status: number) => ({
    json: (data: any) => new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  })
})

// Test data factories
export const createTestUser = () => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'user',
  is_active: true,
  created_at: new Date().toISOString()
})

export const createTestRisk = () => ({
  id: 1,
  title: 'Test Risk',
  description: 'Test risk description',
  category: 'Security',
  probability: 3,
  impact: 4,
  risk_score: 12,
  status: 'active',
  created_at: new Date().toISOString()
})

export const createTestOrganization = () => ({
  id: 1,
  name: 'Test Organization',
  description: 'Test organization description',
  type: 'Enterprise',
  industry: 'Technology',
  size: 'Large',
  country: 'US',
  is_active: true,
  created_at: new Date().toISOString()
})

// JWT utilities for testing
export const createTestJWT = async (payload: any) => {
  const secret = mockEnv.JWT_SECRET!
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(payload))
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return btoa(JSON.stringify(payload)) + '.' + btoa(String.fromCharCode(...new Uint8Array(signature)))
}

// Database test utilities
export const setupTestDatabase = async () => {
  // Mock database setup for tests
  return mockEnv.DB
}

export const cleanupTestDatabase = async () => {
  // Mock database cleanup for tests
}