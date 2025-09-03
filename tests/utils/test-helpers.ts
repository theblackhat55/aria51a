// Test utilities and helpers for ARIA5.1 Enterprise Security Intelligence Platform

import { expect } from 'vitest'
import type { Page } from '@playwright/test'
import { testUsers, createTestUser, createTestRisk, apiResponses } from '../fixtures/test-data'

// Authentication helpers
export const authHelpers = {
  /**
   * Simulate user login and return JWT token
   */
  async login(username: string, password: string): Promise<string> {
    // Mock JWT creation for testing
    const payload = {
      userId: testUsers.admin.id,
      username,
      role: testUsers.admin.role,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiration
    }
    
    // Simple base64 encoding for testing (not secure, just for tests)
    return btoa(JSON.stringify(payload))
  },

  /**
   * Verify JWT token structure and content
   */
  verifyToken(token: string): any {
    try {
      return JSON.parse(atob(token))
    } catch {
      throw new Error('Invalid token format')
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.verifyToken(token)
      const now = Math.floor(Date.now() / 1000)
      return payload.exp < now
    } catch {
      return true
    }
  },

  /**
   * Create admin token for testing
   */
  async createAdminToken(): Promise<string> {
    return this.login('admin', 'demo123')
  },

  /**
   * Create user token for testing
   */
  async createUserToken(role = 'user'): Promise<string> {
    const user = role === 'admin' ? testUsers.admin : testUsers.regular_user
    return this.login(user.username, 'demo123')
  }
}

// Database test helpers
export const dbHelpers = {
  /**
   * Create test database with seed data
   */
  async setupTestDb(): Promise<MockDatabase> {
    const db = new MockDatabase()
    await db.seed()
    return db
  },

  /**
   * Clean up test database
   */
  async cleanupTestDb(db: MockDatabase): Promise<void> {
    await db.reset()
  },

  /**
   * Verify database operation results
   */
  verifyDbResult(result: any, expectedChanges = 1): void {
    expect(result).toBeDefined()
    expect(result.meta).toBeDefined()
    expect(result.meta.changes).toBe(expectedChanges)
  },

  /**
   * Verify database query results
   */
  verifyQueryResults(results: any[], expectedCount?: number): void {
    expect(results).toBeInstanceOf(Array)
    if (expectedCount !== undefined) {
      expect(results).toHaveLength(expectedCount)
    }
  }
}

// Mock database for testing
export class MockDatabase {
  private tables = new Map<string, any[]>()
  private lastId = 0

  constructor() {
    this.reset()
  }

  reset(): void {
    this.tables.clear()
    this.tables.set('users', [])
    this.tables.set('organizations', [])
    this.tables.set('risks', [])
    this.tables.set('incidents', [])
    this.tables.set('assets', [])
    this.tables.set('audit_logs', [])
    this.lastId = 0
  }

  async seed(): Promise<void> {
    // Add test users
    this.tables.set('users', Object.values(testUsers))
    
    // Add test data
    this.tables.set('risks', [
      createTestRisk({ id: 1, title: 'Test Security Risk', category: 'Security' }),
      createTestRisk({ id: 2, title: 'Test Operational Risk', category: 'Operational' }),
      createTestRisk({ id: 3, title: 'Test Compliance Risk', category: 'Compliance' })
    ])

    this.lastId = 100 // Set high starting ID
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    const lowerSql = sql.toLowerCase().trim()
    
    if (lowerSql.startsWith('select')) {
      return this.handleSelect(sql, params)
    } else if (lowerSql.startsWith('insert')) {
      return this.handleInsert(sql, params)
    } else if (lowerSql.startsWith('update')) {
      return this.handleUpdate(sql, params)
    } else if (lowerSql.startsWith('delete')) {
      return this.handleDelete(sql, params)
    }
    
    return { results: [], meta: {} }
  }

  private handleSelect(sql: string, params: any[]): any {
    // Simple table extraction for testing
    const tableMatch = sql.match(/from\s+(\w+)/i)
    if (!tableMatch) return { results: [], meta: {} }
    
    const tableName = tableMatch[1]
    const data = this.tables.get(tableName) || []
    
    return { results: data, meta: { total: data.length } }
  }

  private handleInsert(sql: string, params: any[]): any {
    const tableMatch = sql.match(/into\s+(\w+)/i)
    if (!tableMatch) return { meta: { changes: 0, last_row_id: 0 } }
    
    const tableName = tableMatch[1]
    const table = this.tables.get(tableName) || []
    
    const newId = ++this.lastId
    const newRow = {
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...this.extractInsertValues(sql, params)
    }
    
    table.push(newRow)
    this.tables.set(tableName, table)
    
    return { meta: { changes: 1, last_row_id: newId } }
  }

  private handleUpdate(sql: string, params: any[]): any {
    const tableMatch = sql.match(/update\s+(\w+)/i)
    if (!tableMatch) return { meta: { changes: 0 } }
    
    const tableName = tableMatch[1]
    const table = this.tables.get(tableName) || []
    
    // Simple update - update first matching row
    if (table.length > 0) {
      table[0] = {
        ...table[0],
        updated_at: new Date().toISOString(),
        ...this.extractUpdateValues(sql, params)
      }
      return { meta: { changes: 1 } }
    }
    
    return { meta: { changes: 0 } }
  }

  private handleDelete(sql: string, params: any[]): any {
    const tableMatch = sql.match(/from\s+(\w+)/i)
    if (!tableMatch) return { meta: { changes: 0 } }
    
    const tableName = tableMatch[1]
    const table = this.tables.get(tableName) || []
    
    // Simple delete - remove first item
    if (table.length > 0) {
      table.shift()
      return { meta: { changes: 1 } }
    }
    
    return { meta: { changes: 0 } }
  }

  private extractInsertValues(sql: string, params: any[]): any {
    // Simple value extraction for testing
    return { title: 'Test Item', status: 'active' }
  }

  private extractUpdateValues(sql: string, params: any[]): any {
    // Simple update value extraction
    return { updated: true }
  }
}

// API test helpers
export const apiHelpers = {
  /**
   * Create mock API response
   */
  createResponse(data: any, status = 200): any {
    if (status >= 400) {
      return apiResponses.error(data.message || 'Error', status)
    }
    return apiResponses.success(data)
  },

  /**
   * Create paginated API response
   */
  createPaginatedResponse(items: any[], page = 1, limit = 10): any {
    return apiResponses.paginated(items, page, limit)
  },

  /**
   * Simulate API delay
   */
  async simulateDelay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  /**
   * Validate API response format
   */
  validateApiResponse(response: any): void {
    expect(response).toHaveProperty('success')
    expect(response).toHaveProperty('timestamp')
    
    if (response.success) {
      expect(response).toHaveProperty('data')
    } else {
      expect(response).toHaveProperty('error')
      expect(response).toHaveProperty('status')
    }
  }
}

// Performance test helpers
export const performanceHelpers = {
  /**
   * Measure execution time
   */
  async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now()
    const result = await fn()
    const duration = Date.now() - start
    return { result, duration }
  },

  /**
   * Assert operation completes within time limit
   */
  async expectWithinTime<T>(fn: () => Promise<T>, maxMs: number): Promise<T> {
    const { result, duration } = await this.measureTime(fn)
    expect(duration).toBeLessThan(maxMs)
    return result
  },

  /**
   * Simulate load testing
   */
  async simulateLoad(fn: () => Promise<any>, concurrency = 10, iterations = 100): Promise<any[]> {
    const promises = []
    
    for (let i = 0; i < iterations; i++) {
      if (promises.length >= concurrency) {
        await Promise.race(promises)
      }
      promises.push(fn())
    }
    
    return Promise.all(promises)
  }
}

// E2E test helpers for Playwright
export const e2eHelpers = {
  /**
   * Login user in browser
   */
  async login(page: Page, username = 'admin', password = 'demo123'): Promise<void> {
    await page.goto('/login')
    await page.fill('input[name="username"]', username)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/.*\/dashboard/)
  },

  /**
   * Logout user in browser
   */
  async logout(page: Page): Promise<void> {
    await page.click('[data-testid="user-menu-trigger"]')
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL(/.*\/login/)
  },

  /**
   * Navigate to specific page
   */
  async navigateTo(page: Page, path: string): Promise<void> {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  },

  /**
   * Fill and submit form
   */
  async fillAndSubmitForm(page: Page, formData: Record<string, string>, submitSelector = 'button[type="submit"]'): Promise<void> {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `input[name="${field}"], select[name="${field}"], textarea[name="${field}"]`
      await page.fill(selector, value)
    }
    await page.click(submitSelector)
  },

  /**
   * Wait for toast notification
   */
  async waitForToast(page: Page, expectedText?: string): Promise<void> {
    const toast = page.locator('[data-testid="toast-notification"]')
    await toast.waitFor({ state: 'visible' })
    
    if (expectedText) {
      await expect(toast).toContainText(expectedText)
    }
  },

  /**
   * Take screenshot on failure
   */
  async screenshotOnFailure(page: Page, testName: string): Promise<void> {
    await page.screenshot({
      path: `test-results/screenshots/${testName}-failure.png`,
      fullPage: true
    })
  },

  /**
   * Check page accessibility
   */
  async checkAccessibility(page: Page): Promise<void> {
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count()
    expect(headings).toBeGreaterThan(0)
    
    // Check for alt text on images
    const images = await page.locator('img').count()
    for (let i = 0; i < images; i++) {
      const img = page.locator('img').nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
    
    // Check for proper button elements
    const divButtons = await page.locator('div[onclick], span[onclick]').count()
    expect(divButtons).toBe(0) // Should use proper button elements
  }
}

// Validation helpers
export const validationHelpers = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * Validate password strength
   */
  isStrongPassword(password: string): boolean {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /\d/.test(password)
  },

  /**
   * Validate risk score calculation
   */
  calculateRiskScore(probability: number, impact: number): number {
    return probability * impact
  },

  /**
   * Validate date format
   */
  isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  },

  /**
   * Validate required fields
   */
  validateRequired(obj: any, requiredFields: string[]): string[] {
    const missing = []
    for (const field of requiredFields) {
      if (!obj[field]) {
        missing.push(field)
      }
    }
    return missing
  }
}

// Error simulation helpers
export const errorHelpers = {
  /**
   * Simulate network error
   */
  createNetworkError(): Error {
    const error = new Error('Network request failed')
    error.name = 'NetworkError'
    return error
  },

  /**
   * Simulate timeout error
   */
  createTimeoutError(): Error {
    const error = new Error('Request timeout')
    error.name = 'TimeoutError'
    return error
  },

  /**
   * Simulate validation error
   */
  createValidationError(field: string, message: string): Error {
    const error = new Error(`Validation failed: ${field} - ${message}`)
    error.name = 'ValidationError'
    return error
  },

  /**
   * Simulate database error
   */
  createDatabaseError(): Error {
    const error = new Error('Database connection failed')
    error.name = 'DatabaseError'
    return error
  }
}

// Export all helpers
export default {
  auth: authHelpers,
  db: dbHelpers,
  api: apiHelpers,
  performance: performanceHelpers,
  e2e: e2eHelpers,
  validation: validationHelpers,
  error: errorHelpers,
  MockDatabase
}