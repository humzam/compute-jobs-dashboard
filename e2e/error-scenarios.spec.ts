import { test, expect } from './fixtures/test-fixtures';

test.describe('Error Scenarios and Edge Cases', () => {
  test.beforeEach(async ({ seedData }) => {
    // Use seedData fixture for consistent test data
  });

  test('should handle API failures gracefully', async ({ page }) => {
    // Mock API failure for job creation
    await page.route('**/api/jobs/', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="job-form"]', { timeout: 10000 });
    
    // Try to create a job
    await page.fill('input[placeholder="Enter job name..."]', 'Failed Job Test');
    await page.click('button[type="submit"]:has-text("Create Job")');
    
    // Should show error toast
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="toast-error"]')).toContainText('Failed to create job');
  });

  test('should handle network timeouts', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/jobs/', route => {
      // Delay response by 10 seconds to simulate timeout
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: [], count: 0 })
        });
      }, 10000);
    });

    await page.goto('/');
    
    // Should show loading state initially
    await expect(page.locator('text=Loading jobs...')).toBeVisible({ timeout: 5000 });
    
    // After timeout, should show error state or retry option
    await expect(page.locator('text=Try again')).toBeVisible({ timeout: 15000 });
  });

  test('should validate job creation form', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="job-form"]', { timeout: 10000 });
    
    // Test empty form submission
    const submitButton = page.locator('button[type="submit"]:has-text("Create Job")');
    await expect(submitButton).toBeDisabled();
    
    // Test whitespace-only job name
    await page.fill('input[placeholder="Enter job name..."]', '   ');
    await expect(submitButton).toBeDisabled();
    
    // Test valid job name
    await page.fill('input[placeholder="Enter job name..."]', 'Valid Job Name');
    await expect(submitButton).toBeEnabled();
    
    // Test extremely long job name
    const longName = 'x'.repeat(300);
    await page.fill('input[placeholder="Enter job name..."]', longName);
    await page.click('button[type="submit"]:has-text("Create Job")');
    
    // Should either succeed or show appropriate validation error
    await page.waitForTimeout(2000);
  });

  test('should handle status update failures', async ({ page }) => {
    // Mock status update failure
    await page.route('**/api/jobs/*/');
    route => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid status update' })
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Try to update a job status
    const firstJobRow = page.locator('table tbody tr').first();
    await firstJobRow.locator('button:has-text("Edit Status")').click();
    
    // Wait for modal and update status
    await page.waitForSelector('[data-testid="status-update-modal"]', { timeout: 5000 });
    await page.selectOption('select#status', 'RUNNING');
    await page.click('button:has-text("Update Status")');
    
    // Should show error toast
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="toast-error"]')).toContainText('Failed to update job status');
  });

  test('should handle job deletion failures', async ({ page }) => {
    // Mock deletion failure
    await page.route('**/api/jobs/*/', route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Job not found' })
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Try to delete a job
    const firstJobRow = page.locator('table tbody tr').first();
    await firstJobRow.locator('button:has-text("Delete")').click();
    
    // Confirm deletion
    await page.waitForSelector('[data-testid="confirm-modal"]', { timeout: 5000 });
    await page.click('button:has-text("Delete"):not(:has-text("Cancel"))');
    
    // Should show error toast
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="toast-error"]')).toContainText('Failed to delete job');
  });

  test('should handle empty job list gracefully', async ({ page, cleanDatabase }) => {
    // Clean database to test empty state
    
    await page.goto('/');
    
    // Should show empty state message
    await expect(page.locator('text=No computational jobs found')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Create your first job to get started')).toBeVisible();
    
    // Pagination should not be visible
    await expect(page.locator('[data-testid="pagination"]')).not.toBeVisible();
    
    // Job form should still be functional
    await expect(page.locator('[data-testid="job-form"]')).toBeVisible();
    await page.fill('input[placeholder="Enter job name..."]', 'First Job');
    await page.click('button[type="submit"]:has-text("Create Job")');
    
    // Should show success and new job in list
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table tbody')).toContainText('First Job');
  });

  test('should handle browser offline state', async ({ page, context }) => {
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Go offline
    await context.setOffline(true);
    
    // Try to create a job while offline
    await page.fill('input[placeholder="Enter job name..."]', 'Offline Job Test');
    await page.click('button[type="submit"]:has-text("Create Job")');
    
    // Should show network error
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible({ timeout: 5000 });
    
    // Go back online
    await context.setOffline(false);
    
    // Should be able to retry successfully
    await page.click('button[type="submit"]:has-text("Create Job")');
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle concurrent operations', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Get first job row
    const firstJobRow = page.locator('table tbody tr').first();
    
    // Try to perform multiple operations simultaneously
    const statusUpdatePromise = (async () => {
      await firstJobRow.locator('button:has-text("Edit Status")').click();
      await page.waitForSelector('[data-testid="status-update-modal"]', { timeout: 5000 });
      await page.selectOption('select#status', 'RUNNING');
      await page.click('button:has-text("Update Status")');
    })();
    
    // Simultaneously try to delete (should be prevented by modal)
    const deletePromise = (async () => {
      await page.waitForTimeout(100); // Small delay
      await firstJobRow.locator('button:has-text("Delete")').click();
    })();
    
    // Wait for both operations
    await Promise.all([statusUpdatePromise, deletePromise]);
    
    // Should handle gracefully - either one succeeds or both are handled properly
    await page.waitForTimeout(2000);
  });

  test('should validate progress field constraints', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Find a job to update
    const jobRow = page.locator('table tbody tr').first();
    await jobRow.locator('button:has-text("Edit Status")').click();
    
    // Wait for modal
    await page.waitForSelector('[data-testid="status-update-modal"]', { timeout: 5000 });
    
    // Set status to RUNNING to show progress field
    await page.selectOption('select#status', 'RUNNING');
    
    // Test invalid progress values
    await page.fill('input#progress', '-10');
    const progressInput = page.locator('input#progress');
    await expect(progressInput).toHaveValue('0'); // Should be constrained to 0
    
    await page.fill('input#progress', '150');
    await expect(progressInput).toHaveValue('100'); // Should be constrained to 100
    
    await page.fill('input#progress', 'abc');
    await expect(progressInput).toHaveValue(''); // Should clear invalid input
    
    // Test valid progress
    await page.fill('input#progress', '50');
    await expect(progressInput).toHaveValue('50');
  });

  test('should handle rapid filter changes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Rapidly change filters to test debouncing and race conditions
    const searchInput = page.locator('input[placeholder*="Search jobs"]');
    
    await searchInput.fill('Test');
    await searchInput.fill('Processing');
    await searchInput.fill('Machine');
    await searchInput.fill('Final Search');
    
    // Wait for debounce
    await page.waitForTimeout(1000);
    
    // Should show results for final search term
    const results = page.locator('table tbody tr');
    const resultCount = await results.count();
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(1000);
    
    // Should show all jobs again
    const allResults = await page.locator('table tbody tr').count();
    expect(allResults).toBeGreaterThanOrEqual(resultCount);
  });
});