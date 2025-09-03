import { test, expect } from '@playwright/test'

test.describe('Risk Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to risks page
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.goto('/risks')
    await expect(page.locator('h1')).toContainText('Risk')
  })

  test('should display risks table', async ({ page }) => {
    // Check if risks table is visible
    await expect(page.locator('[data-testid="risks-table"]')).toBeVisible()
    
    // Check table headers
    await expect(page.locator('th:has-text("Title")')).toBeVisible()
    await expect(page.locator('th:has-text("Category")')).toBeVisible()
    await expect(page.locator('th:has-text("Risk Score")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
  })

  test('should create new risk', async ({ page }) => {
    // Click create risk button
    await page.click('[data-testid="create-risk-button"]')
    
    // Wait for modal/form to appear
    await expect(page.locator('[data-testid="risk-form"]')).toBeVisible()
    
    // Fill out risk form
    await page.fill('input[name="title"]', 'E2E Test Risk')
    await page.fill('textarea[name="description"]', 'This is a test risk created by E2E test')
    await page.selectOption('select[name="category"]', 'Security')
    await page.fill('input[name="probability"]', '4')
    await page.fill('input[name="impact"]', '3')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check if risk was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('text=E2E Test Risk')).toBeVisible()
  })

  test('should validate risk form', async ({ page }) => {
    await page.click('[data-testid="create-risk-button"]')
    await expect(page.locator('[data-testid="risk-form"]')).toBeVisible()
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-error"]')).toBeVisible()
    
    // Fill required fields only
    await page.fill('input[name="title"]', 'Validation Test')
    await page.selectOption('select[name="category"]', 'Operational')
    
    // Probability should be 1-5
    await page.fill('input[name="probability"]', '10')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="probability-error"]')).toContainText('between 1 and 5')
    
    // Fix probability
    await page.fill('input[name="probability"]', '3')
    await page.fill('input[name="impact"]', '2')
    await page.click('button[type="submit"]')
    
    // Should succeed
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('should filter risks by category', async ({ page }) => {
    // Check initial number of risks
    const initialRows = await page.locator('[data-testid="risk-row"]').count()
    
    // Apply category filter
    await page.selectOption('[data-testid="category-filter"]', 'Security')
    
    // Wait for filter to apply
    await page.waitForTimeout(1000)
    
    // Check that only Security risks are shown
    const securityRisks = await page.locator('[data-testid="risk-row"]')
    const count = await securityRisks.count()
    
    // Verify all visible risks are Security category
    for (let i = 0; i < count; i++) {
      const category = await securityRisks.nth(i).locator('[data-testid="risk-category"]').textContent()
      expect(category).toBe('Security')
    }
  })

  test('should filter risks by status', async ({ page }) => {
    // Apply status filter
    await page.selectOption('[data-testid="status-filter"]', 'active')
    
    await page.waitForTimeout(1000)
    
    // Check that only active risks are shown
    const activeRisks = await page.locator('[data-testid="risk-row"]')
    const count = await activeRisks.count()
    
    for (let i = 0; i < count; i++) {
      const status = await activeRisks.nth(i).locator('[data-testid="risk-status"]').textContent()
      expect(status).toBe('active')
    }
  })

  test('should search risks by title', async ({ page }) => {
    // Create a specific risk to search for
    await page.click('[data-testid="create-risk-button"]')
    await page.fill('input[name="title"]', 'Unique Search Risk')
    await page.selectOption('select[name="category"]', 'Financial')
    await page.fill('input[name="probability"]', '2')
    await page.fill('input[name="impact"]', '2')
    await page.click('button[type="submit"]')
    
    // Wait for creation to complete
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Search for the risk
    await page.fill('[data-testid="search-input"]', 'Unique Search')
    
    await page.waitForTimeout(1000)
    
    // Should show only matching risks
    await expect(page.locator('text=Unique Search Risk')).toBeVisible()
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '')
    await page.waitForTimeout(500)
  })

  test('should edit existing risk', async ({ page }) => {
    // Find first risk and click edit
    const firstRisk = page.locator('[data-testid="risk-row"]').first()
    await firstRisk.locator('[data-testid="edit-risk-button"]').click()
    
    // Wait for edit form
    await expect(page.locator('[data-testid="risk-form"]')).toBeVisible()
    
    // Modify risk
    await page.fill('input[name="title"]', 'Modified Risk Title')
    await page.fill('input[name="probability"]', '5')
    
    // Submit changes
    await page.click('button[type="submit"]')
    
    // Check if changes were saved
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('text=Modified Risk Title')).toBeVisible()
  })

  test('should delete risk', async ({ page }) => {
    // Create a risk to delete
    await page.click('[data-testid="create-risk-button"]')
    await page.fill('input[name="title"]', 'Risk To Delete')
    await page.selectOption('select[name="category"]', 'Compliance')
    await page.fill('input[name="probability"]', '1')
    await page.fill('input[name="impact"]', '1')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Find and delete the risk
    const riskToDelete = page.locator('[data-testid="risk-row"]:has-text("Risk To Delete")')
    await riskToDelete.locator('[data-testid="delete-risk-button"]').click()
    
    // Confirm deletion
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    await page.click('[data-testid="confirm-delete"]')
    
    // Check if risk was deleted
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('text=Risk To Delete')).not.toBeVisible()
  })

  test('should sort risks by risk score', async ({ page }) => {
    // Click on risk score column header to sort
    await page.click('th:has-text("Risk Score")')
    
    await page.waitForTimeout(1000)
    
    // Check if risks are sorted by risk score
    const riskScores = await page.locator('[data-testid="risk-score"]').allTextContents()
    const scores = riskScores.map(score => parseInt(score))
    
    // Check if sorted (ascending or descending)
    const isAscending = scores.every((val, i, arr) => i === 0 || arr[i - 1] <= val)
    const isDescending = scores.every((val, i, arr) => i === 0 || arr[i - 1] >= val)
    
    expect(isAscending || isDescending).toBeTruthy()
  })

  test('should paginate risks table', async ({ page }) => {
    // Check if pagination is present (assuming there are enough risks)
    const pagination = page.locator('[data-testid="pagination"]')
    
    if (await pagination.isVisible()) {
      // Get current page number
      const currentPage = await page.locator('[data-testid="current-page"]').textContent()
      
      // Click next page
      await page.click('[data-testid="next-page"]')
      
      await page.waitForTimeout(1000)
      
      // Check if page changed
      const newPage = await page.locator('[data-testid="current-page"]').textContent()
      expect(newPage).not.toBe(currentPage)
    }
  })

  test('should calculate risk score correctly', async ({ page }) => {
    await page.click('[data-testid="create-risk-button"]')
    
    // Create risk with known probability and impact
    await page.fill('input[name="title"]', 'Score Calculation Test')
    await page.selectOption('select[name="category"]', 'Security')
    await page.fill('input[name="probability"]', '4')
    await page.fill('input[name="impact"]', '5')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Check if risk score is calculated correctly (4 * 5 = 20)
    const riskRow = page.locator('[data-testid="risk-row"]:has-text("Score Calculation Test")')
    const riskScore = await riskRow.locator('[data-testid="risk-score"]').textContent()
    
    expect(riskScore).toBe('20')
  })
})

test.describe('Risk Management Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.goto('/risks')
  })

  test('should export risks to PDF', async ({ page }) => {
    // Click export button
    await page.click('[data-testid="export-risks"]')
    
    // Select PDF format
    await page.click('[data-testid="export-pdf"]')
    
    // Start download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="confirm-export"]')
    ])
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.pdf')
  })

  test('should export risks to Excel', async ({ page }) => {
    await page.click('[data-testid="export-risks"]')
    await page.click('[data-testid="export-excel"]')
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="confirm-export"]')
    ])
    
    expect(download.suggestedFilename()).toContain('.xlsx')
  })

  test('should display risk statistics', async ({ page }) => {
    // Check statistics section
    await expect(page.locator('[data-testid="risk-stats"]')).toBeVisible()
    
    // Check individual stats
    await expect(page.locator('[data-testid="total-risks-stat"]')).toBeVisible()
    await expect(page.locator('[data-testid="high-risks-stat"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-risks-stat"]')).toBeVisible()
    
    // Stats should have numeric values
    const totalRisks = await page.locator('[data-testid="total-risks-stat"] .stat-number').textContent()
    expect(totalRisks).toMatch(/^\d+$/)
  })

  test('should show risk details in modal', async ({ page }) => {
    // Click on first risk to view details
    const firstRisk = page.locator('[data-testid="risk-row"]').first()
    await firstRisk.click()
    
    // Check if modal opens
    await expect(page.locator('[data-testid="risk-details-modal"]')).toBeVisible()
    
    // Check modal content
    await expect(page.locator('[data-testid="risk-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="risk-description"]')).toBeVisible()
    await expect(page.locator('[data-testid="risk-category"]')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="close-modal"]')
    await expect(page.locator('[data-testid="risk-details-modal"]')).not.toBeVisible()
  })

  test('should handle bulk operations', async ({ page }) => {
    // Select multiple risks
    await page.check('[data-testid="select-all-risks"]')
    
    // Check if bulk actions are available
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible()
    
    // Test bulk status change
    await page.click('[data-testid="bulk-status-change"]')
    await page.selectOption('[data-testid="new-status"]', 'mitigated')
    await page.click('[data-testid="apply-bulk-change"]')
    
    // Confirm bulk change
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})

test.describe('Risk Management Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.goto('/risks')
  })

  test('should be functional on mobile devices', async ({ page }) => {
    // Check if mobile layout is active
    await expect(page.locator('[data-testid="mobile-risk-card"]')).toBeVisible()
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test create risk on mobile
    await page.click('[data-testid="mobile-create-risk"]')
    await expect(page.locator('[data-testid="risk-form"]')).toBeVisible()
  })

  test('should handle touch interactions', async ({ page }) => {
    // Test swipe actions on risk cards (if implemented)
    const firstRiskCard = page.locator('[data-testid="mobile-risk-card"]').first()
    
    // Swipe right to reveal actions
    await firstRiskCard.hover()
    await page.mouse.down()
    await page.mouse.move(100, 0)
    await page.mouse.up()
    
    // Check if actions are revealed
    // Note: This would require actual swipe gesture implementation
  })
})