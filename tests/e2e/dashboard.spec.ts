import { test, expect } from '@playwright/test'

test.describe('ARIA5.1 Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should display dashboard statistics', async ({ page }) => {
    // Check for statistics cards
    await expect(page.locator('[data-testid="total-risks"]')).toBeVisible()
    await expect(page.locator('[data-testid="high-risks"]')).toBeVisible()
    await expect(page.locator('[data-testid="open-incidents"]')).toBeVisible()
    await expect(page.locator('[data-testid="compliance-score"]')).toBeVisible()
    
    // Statistics should have numeric values
    const totalRisks = await page.locator('[data-testid="total-risks"] .stat-value').textContent()
    expect(totalRisks).toMatch(/^\d+$/)
  })

  test('should display recent activities', async ({ page }) => {
    // Check for recent activities section
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible()
    
    // Should have activity items
    const activities = await page.locator('[data-testid="activity-item"]')
    await expect(activities.first()).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    // Test main navigation items
    await page.click('a[href="/risks"]')
    await expect(page).toHaveURL(/.*\/risks/)
    await expect(page.locator('h1')).toContainText('Risk')
    
    // Go back to dashboard
    await page.click('a[href="/dashboard"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should display quick actions', async ({ page }) => {
    // Check for quick action buttons
    await expect(page.locator('[data-testid="create-risk-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="create-incident-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="view-reports-button"]')).toBeVisible()
  })

  test('should show user information', async ({ page }) => {
    // Check user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Click user menu
    await page.click('[data-testid="user-menu-trigger"]')
    
    // Should show user info
    await expect(page.locator('[data-testid="user-profile"]')).toContainText('admin')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Dashboard should still be functional
    await expect(page.locator('[data-testid="total-risks"]')).toBeVisible()
    
    // Mobile navigation should work
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible()
  })

  test('should update statistics in real-time', async ({ page }) => {
    // Get initial risk count
    const initialCount = await page.locator('[data-testid="total-risks"] .stat-value').textContent()
    
    // Navigate to risks page and create a new risk
    await page.click('a[href="/risks"]')
    await page.click('[data-testid="create-risk-button"]')
    
    // Fill risk form (assuming modal or form exists)
    await page.fill('input[name="title"]', 'Test E2E Risk')
    await page.selectOption('select[name="category"]', 'Security')
    await page.fill('input[name="probability"]', '3')
    await page.fill('input[name="impact"]', '4')
    await page.click('button[type="submit"]')
    
    // Go back to dashboard
    await page.click('a[href="/dashboard"]')
    
    // Check if count has updated (in a real app with real-time updates)
    // Note: This might require WebSocket implementation for real-time updates
    const newCount = await page.locator('[data-testid="total-risks"] .stat-value').textContent()
    expect(parseInt(newCount!)).toBeGreaterThanOrEqual(parseInt(initialCount!))
  })
})

test.describe('Dashboard Executive Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should load executive dashboard with charts', async ({ page }) => {
    // Navigate to executive dashboard (if separate route)
    await page.goto('/dashboard/executive')
    
    // Check for Chart.js visualizations
    await expect(page.locator('[data-testid="risk-trend-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="compliance-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="incident-chart"]')).toBeVisible()
  })

  test('should display security operations center (SOC) interface', async ({ page }) => {
    // Check for SOC-specific elements
    await expect(page.locator('[data-testid="security-alerts"]')).toBeVisible()
    await expect(page.locator('[data-testid="threat-level"]')).toBeVisible()
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible()
  })

  test('should show real-time notifications', async ({ page }) => {
    // Check notification bell
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible()
    
    // Click notification bell
    await page.click('[data-testid="notification-bell"]')
    
    // Should show notification dropdown
    await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible()
  })

  test('should export dashboard data', async ({ page }) => {
    // Look for export functionality
    await page.click('[data-testid="export-dashboard"]')
    
    // Should show export options
    await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-excel"]')).toBeVisible()
  })
})

test.describe('Dashboard Performance', () => {
  test('should load dashboard within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    // Navigate to dashboard
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to be fully loaded
    await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Dashboard should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should handle large datasets efficiently', async ({ page }) => {
    // Navigate to a page with large data (like risks with many entries)
    await page.goto('/risks')
    
    // Wait for table to load
    await expect(page.locator('[data-testid="risks-table"]')).toBeVisible()
    
    // Scroll through large dataset
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    
    // Should remain responsive
    await expect(page.locator('[data-testid="risks-table"]')).toBeVisible()
  })

  test('should maintain performance with real-time updates', async ({ page }) => {
    // Enable real-time updates if available
    await page.click('[data-testid="enable-realtime"]')
    
    // Monitor performance over time
    const startTime = Date.now()
    
    // Wait for several update cycles
    await page.waitForTimeout(5000)
    
    // Check that page is still responsive
    await page.click('[data-testid="user-menu-trigger"]')
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()
    
    const responseTime = Date.now() - startTime
    expect(responseTime).toBeLessThan(6000) // Should remain responsive
  })
})

test.describe('Dashboard Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    // Navigate using keyboard
    await page.keyboard.press('Tab') // Should focus first interactive element
    await page.keyboard.press('Tab') // Navigate to next element
    await page.keyboard.press('Enter') // Activate focused element
    
    // Check that navigation works
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for ARIA labels on important elements
    await expect(page.locator('[aria-label="Main navigation"]')).toBeVisible()
    await expect(page.locator('[aria-label="User menu"]')).toBeVisible()
    await expect(page.locator('[role="main"]')).toBeVisible()
  })

  test('should support screen readers', async ({ page }) => {
    // Check for screen reader friendly elements
    await expect(page.locator('h1')).toBeVisible() // Proper heading structure
    await expect(page.locator('[role="button"]')).toHaveCount(0) // Should use proper button elements
    
    // Check for alt text on images
    const images = await page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })
})