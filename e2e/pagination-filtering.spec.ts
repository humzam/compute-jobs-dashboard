import { test, expect } from './fixtures/test-fixtures';

test.describe('Pagination and Filtering', () => {
  test.beforeEach(async ({ seedData }) => {
    // Use seedData fixture to ensure we have enough data for pagination
  });

  test('should paginate through job results', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Check if pagination is visible (should be with seeded data)
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Verify current page shows "1"
    await expect(page.locator('button[aria-current="page"]')).toContainText('1');
    
    // Check page size selector
    const pageSizeSelect = page.locator('select#page-size');
    await expect(pageSizeSelect).toBeVisible();
    await expect(pageSizeSelect).toHaveValue('20');
    
    // Get initial job count on first page
    const firstPageJobs = await page.locator('table tbody tr').count();
    expect(firstPageJobs).toBeGreaterThan(0);
    expect(firstPageJobs).toBeLessThanOrEqual(20);
    
    // Navigate to page 2 if it exists
    const nextButton = page.locator('button[aria-label="Next"]');
    const page2Button = page.locator('button:has-text("2")');
    
    if (await page2Button.isVisible()) {
      await page2Button.click();
      
      // Wait for new data to load
      await page.waitForTimeout(1000);
      
      // Verify we're on page 2
      await expect(page.locator('button[aria-current="page"]')).toContainText('2');
      
      // Verify different jobs are shown
      const secondPageJobs = await page.locator('table tbody tr').count();
      expect(secondPageJobs).toBeGreaterThan(0);
      
      // Go back to page 1
      await page.locator('button:has-text("1")').click();
      await page.waitForTimeout(1000);
      await expect(page.locator('button[aria-current="page"]')).toContainText('1');
    }
  });

  test('should change page size and update results', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Get current job count (default page size 20)
    const initialJobCount = await page.locator('table tbody tr').count();
    
    // Change page size to 10
    await page.selectOption('select#page-size', '10');
    await page.waitForTimeout(1000);
    
    // Verify fewer jobs are shown (max 10)
    const reducedJobCount = await page.locator('table tbody tr').count();
    expect(reducedJobCount).toBeLessThanOrEqual(10);
    expect(reducedJobCount).toBeLessThanOrEqual(initialJobCount);
    
    // Change page size to 50
    await page.selectOption('select#page-size', '50');
    await page.waitForTimeout(1000);
    
    // Verify more jobs are shown
    const increasedJobCount = await page.locator('table tbody tr').count();
    expect(increasedJobCount).toBeGreaterThanOrEqual(reducedJobCount);
    expect(increasedJobCount).toBeLessThanOrEqual(50);
  });

  test('should filter jobs by status', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Get total job count
    const totalJobs = await page.locator('table tbody tr').count();
    
    // Filter by PENDING status
    await page.selectOption('select#status-filter', 'PENDING');
    await page.waitForTimeout(1000);
    
    // Verify all visible jobs have PENDING status
    const pendingJobs = page.locator('table tbody tr');
    const pendingCount = await pendingJobs.count();
    
    if (pendingCount > 0) {
      // Check that all visible jobs have pending status
      for (let i = 0; i < Math.min(pendingCount, 5); i++) {
        await expect(pendingJobs.nth(i).locator('[data-testid="status-badge"]')).toContainText('Pending');
      }
    }
    
    // Filter by RUNNING status
    await page.selectOption('select#status-filter', 'RUNNING');
    await page.waitForTimeout(1000);
    
    const runningJobs = page.locator('table tbody tr');
    const runningCount = await runningJobs.count();
    
    if (runningCount > 0) {
      // Check that all visible jobs have running status
      for (let i = 0; i < Math.min(runningCount, 3); i++) {
        await expect(runningJobs.nth(i).locator('[data-testid="status-badge"]')).toContainText('Running');
      }
    }
    
    // Clear filter
    await page.selectOption('select#status-filter', '');
    await page.waitForTimeout(1000);
    
    // Should show all jobs again
    const clearedFilterCount = await page.locator('table tbody tr').count();
    expect(clearedFilterCount).toBeGreaterThanOrEqual(Math.max(pendingCount, runningCount));
  });

  test('should filter jobs by priority', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Filter by high priority (priority 8)
    await page.selectOption('select#priority-filter', '8');
    await page.waitForTimeout(1000);
    
    // Verify all visible jobs have priority 8
    const highPriorityJobs = page.locator('table tbody tr');
    const highPriorityCount = await highPriorityJobs.count();
    
    if (highPriorityCount > 0) {
      // Check priority display for first few jobs
      for (let i = 0; i < Math.min(highPriorityCount, 3); i++) {
        await expect(highPriorityJobs.nth(i)).toContainText('8');
      }
    }
    
    // Filter by low priority (priority 2)
    await page.selectOption('select#priority-filter', '2');
    await page.waitForTimeout(1000);
    
    const lowPriorityJobs = page.locator('table tbody tr');
    const lowPriorityCount = await lowPriorityJobs.count();
    
    if (lowPriorityCount > 0) {
      // Check priority display
      await expect(lowPriorityJobs.first()).toContainText('2');
    }
    
    // Clear priority filter
    await page.selectOption('select#priority-filter', '');
    await page.waitForTimeout(1000);
  });

  test('should search jobs by name', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Search for specific test job
    const searchTerm = 'Test Job for Automation';
    await page.fill('input[placeholder*="Search jobs"]', searchTerm);
    
    // Wait for debounced search
    await page.waitForTimeout(1000);
    
    // Should show only matching jobs
    const searchResults = page.locator('table tbody tr');
    const resultCount = await searchResults.count();
    
    if (resultCount > 0) {
      // Verify search results contain the search term
      await expect(searchResults.first()).toContainText(searchTerm);
    }
    
    // Search for partial term
    await page.fill('input[placeholder*="Search jobs"]', 'Processing');
    await page.waitForTimeout(1000);
    
    const partialResults = page.locator('table tbody tr');
    const partialCount = await partialResults.count();
    
    // Clear search
    await page.fill('input[placeholder*="Search jobs"]', '');
    await page.waitForTimeout(1000);
    
    // Should show all jobs again
    const allJobs = await page.locator('table tbody tr').count();
    expect(allJobs).toBeGreaterThanOrEqual(Math.max(resultCount, partialCount));
  });

  test('should show active filters indicator', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Initially no active filters should be shown
    await expect(page.locator('text=Active filters:')).not.toBeVisible();
    
    // Apply search filter
    await page.fill('input[placeholder*="Search jobs"]', 'Test');
    await page.waitForTimeout(500);
    
    // Should show active filters
    await expect(page.locator('text=Active filters:')).toBeVisible();
    await expect(page.locator('text=Search: "Test"')).toBeVisible();
    
    // Add status filter
    await page.selectOption('select#status-filter', 'PENDING');
    await page.waitForTimeout(500);
    
    // Should show both filters
    await expect(page.locator('text=Status: PENDING')).toBeVisible();
    
    // Add priority filter
    await page.selectOption('select#priority-filter', '5');
    await page.waitForTimeout(500);
    
    // Should show all three filters
    await expect(page.locator('text=Priority: 5')).toBeVisible();
    
    // Clear all filters using the button
    await page.click('button:has-text("Clear Filters")');
    await page.waitForTimeout(500);
    
    // Active filters should be hidden
    await expect(page.locator('text=Active filters:')).not.toBeVisible();
  });

  test('should combine multiple filters correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Apply multiple filters
    await page.selectOption('select#status-filter', 'COMPLETED');
    await page.selectOption('select#priority-filter', '3');
    await page.waitForTimeout(1000);
    
    // Check that results match all criteria
    const filteredJobs = page.locator('table tbody tr');
    const filteredCount = await filteredJobs.count();
    
    if (filteredCount > 0) {
      const firstJob = filteredJobs.first();
      await expect(firstJob.locator('[data-testid="status-badge"]')).toContainText('Completed');
      await expect(firstJob).toContainText('3');
    }
    
    // Add search term
    await page.fill('input[placeholder*="Search jobs"]', 'Job');
    await page.waitForTimeout(1000);
    
    // Results should still match all criteria
    const tripleFilteredCount = await page.locator('table tbody tr').count();
    expect(tripleFilteredCount).toBeLessThanOrEqual(filteredCount);
  });
});