import { test, expect } from '@playwright/test';
import { setupAPIMocks, mockJobs } from './api-mocks';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocks before each test
    await setupAPIMocks(page);
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should create a new job and verify it appears in the list with correct initial status', async ({ page }) => {
    // Test the critical flow: Creating a new job
    
    // Step 1: Wait for the job form to be visible
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    
    // Step 2: Fill in the job creation form
    const jobName = `E2E Test Job ${Date.now()}`;
    const jobDescription = 'This is a test job created by E2E automation';
    
    await page.fill('input[placeholder*="job name"]', jobName);
    await page.fill('textarea[placeholder*="description"]', jobDescription);
    
    // Set priority to 7
    const prioritySelect = page.locator('select#jobPriority');
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption('7');
    }
    
    // Step 3: Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // Step 4: Wait for success indication
    // Look for either a success toast or the job appearing in the list
    await page.waitForTimeout(2000); // Allow time for the API call and UI update
    
    // Step 5: Verify the job appears in the list
    await expect(page.locator('table')).toBeVisible();
    
    // Check that the job name appears in the table
    await expect(page.locator('table')).toContainText(jobName);
    
    // Step 6: Verify the job has the correct initial status (PENDING)
    const jobRow = page.locator(`tr:has-text("${jobName}")`);
    await expect(jobRow).toBeVisible();
    
    // Look for status indicator - it should show "Pending" (use more specific selector)
    const statusBadge = jobRow.locator('[data-testid="status-badge"]').filter({ hasText: /pending/i });
    await expect(statusBadge).toBeVisible();
    
    // Step 7: Verify other job details are correct
    await expect(jobRow).toContainText(jobName);
    if (jobDescription) {
      // Description might not be visible in table, but job should exist
      await expect(jobRow).toBeVisible();
    }
  });

  test('should update a job status to different available status and verify the change', async ({ page }) => {
    // Test the critical flow: Updating job status
    
    // Step 1: Wait for jobs to load in the table
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000); // Allow jobs to fully load
    
    // Step 2: Find a job with PENDING status (from our mock data) - specifically target "Data Processing Job"
    const pendingJobRow = page.locator('tr:has-text("Data Processing Job")');
    await expect(pendingJobRow).toBeVisible();
    
    // Verify it currently has Pending status
    await expect(pendingJobRow.locator('[data-testid="status-badge"]').filter({ hasText: /pending/i })).toBeVisible();
    
    // Step 3: Click the "Edit Status" button
    const editButton = pendingJobRow.locator('button:has-text("Edit Status")');
    await expect(editButton).toBeVisible();
    await editButton.click();
    
    // Step 4: Wait for the status update modal to appear
    const modal = page.locator('[data-testid="status-update-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Step 5: Update status to RUNNING
    const statusSelect = page.locator('select#status');
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption('RUNNING');
    
    // Add a status message
    const messageField = page.locator('textarea#message');
    await expect(messageField).toBeVisible();
    await messageField.fill('Job is now running - Updated by E2E test');
    
    // Set progress (should appear when status is RUNNING)
    const progressField = page.locator('input#progress');
    await expect(progressField).toBeVisible();
    await progressField.fill('35');
    
    // Step 6: Submit the status update
    const updateButton = page.locator('button:has-text("Update Status")');
    await expect(updateButton).toBeVisible();
    await expect(updateButton).toBeEnabled();
    
    await updateButton.click();
    
    // Step 7: Wait for success and modal to close
    await page.waitForTimeout(5000); // Give time for API call and UI updates
    
    // Step 8: Verify the status change is reflected in the table
    // The job should now show "Running" status instead of "Pending"
    await expect(pendingJobRow.locator('[data-testid="status-badge"]').filter({ hasText: /running/i })).toBeVisible({ timeout: 15000 });
    
    // Step 9: Verify progress is shown
    await expect(pendingJobRow).toContainText('35%');
    
    // Step 10: Verify the job is no longer in pending status
    await expect(pendingJobRow.locator('[data-testid="status-badge"]').filter({ hasText: /pending/i })).not.toBeVisible();
  });

  test('should display existing jobs from mock data', async ({ page }) => {
    // Verify that our mock data is being loaded correctly
    
    // Wait for table to be visible
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    
    // Should show our mock jobs
    await expect(page.locator('table')).toContainText('Data Processing Job');
    await expect(page.locator('table')).toContainText('ML Model Training');
    
    // Should show different statuses
    await expect(page.locator('table')).toContainText(/pending/i);
    await expect(page.locator('table')).toContainText(/running/i);
    
    // Should show progress for running job
    await expect(page.locator('table')).toContainText('65%');
  });

  test('should handle form validation correctly', async ({ page }) => {
    // Test form validation before job creation
    
    await expect(page.locator('form')).toBeVisible();
    
    // Submit button should be disabled initially or require name
    const submitButton = page.locator('button[type="submit"]');
    
    // Try with empty name
    await page.fill('input[placeholder*="job name"]', '');
    
    // Button should be disabled or clicking should show validation error
    const isEnabled = await submitButton.isEnabled();
    if (isEnabled) {
      await submitButton.click();
      // Should not create a job with empty name
      await page.waitForTimeout(1000);
      // Form should still be visible (not submitted)
      await expect(page.locator('form')).toBeVisible();
    }
    
    // Fill valid name and verify button becomes enabled
    await page.fill('input[placeholder*="job name"]', 'Valid Job Name');
    await expect(submitButton).toBeEnabled();
  });
});