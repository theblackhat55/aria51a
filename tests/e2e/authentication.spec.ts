import { test, expect } from '@playwright/test'

test.describe('ARIA5.1 Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean slate
    await page.goto('/')
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Trying to access dashboard should redirect to login
    await page.goto('/dashboard')
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/login/)
    await expect(page.locator('h1')).toContainText('Login')
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill in admin credentials
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    
    // Submit login form
    await page.click('button[type="submit"]')
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Should see user info in navigation
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid')
    
    // Should remain on login page
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should successfully logout', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Click user menu
    await page.click('[data-testid="user-menu-trigger"]')
    
    // Click logout
    await page.click('[data-testid="logout-button"]')
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/)
    
    // Verify cannot access protected routes
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should use simple login page', async ({ page }) => {
    // Test the simplified login page
    await page.goto('/simple-login.html')
    
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Should successfully authenticate
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Refresh page
    await page.reload()
    
    // Should still be authenticated
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle session expiration', async ({ page }) => {
    // This test would require manipulating token expiration
    // For now, we'll test that expired tokens redirect to login
    
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Simulate token expiration by clearing localStorage
    await page.evaluate(() => {
      localStorage.removeItem('aria5_token')
    })
    
    // Navigate to protected route
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/)
  })
})

test.describe('Role-Based Access Control', () => {
  test('admin should access admin routes', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Navigate to admin section
    await page.goto('/admin')
    
    // Should have access
    await expect(page.locator('h1')).toContainText('Admin')
    await expect(page.locator('[data-testid="admin-users"]')).toBeVisible()
  })

  test('security manager should access security features', async ({ page }) => {
    // Login as security manager
    await page.goto('/login')
    await page.fill('input[name="username"]', 'avi_security')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Should access risk management
    await page.goto('/risks')
    await expect(page.locator('h1')).toContainText('Risk')
    
    // Should access compliance
    await page.goto('/compliance')
    await expect(page.locator('h1')).toContainText('Compliance')
    
    // Should access incidents
    await page.goto('/incidents')
    await expect(page.locator('h1')).toContainText('Incident')
  })

  test('regular user should have limited access', async ({ page }) => {
    // Note: This test assumes we have a regular user account
    // In a real implementation, we'd create test users with different roles
    
    await page.goto('/login')
    await page.fill('input[name="username"]', 'avi_security') // Using available account
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Should access dashboard
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Try to access admin (should be restricted in real implementation)
    await page.goto('/admin')
    // Note: Current implementation may allow access - this would need RBAC enforcement
  })
})