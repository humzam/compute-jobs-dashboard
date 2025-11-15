import { test, expect } from './fixtures/test-fixtures';

test.describe('Job CRUD Operations', () => {
  test.beforeEach(async ({ seedData }) => {
    // Use the seedData fixture to ensure consistent test data
  });

  test('should create a new job successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="job-form"]', { timeout: 10000 });
    
    // Fill in job creation form
    const jobName = `E2E Test Job ${Date.now()}`;
    const jobDescription = 'This is a test job created by E2E automation';
    
    await page.fill('input[placeholder="Enter job name..."]', jobName);
    await page.fill('textarea[placeholder="Enter job description..."]', jobDescription);
    await page.selectOption('select#jobPriority', '7');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Job")');
    
    // Wait for success toast
    await expect(page.locator('.toast-success')).toContainText('Job created successfully!');
    
    // Verify the job appears in the list
    await expect(page.locator('table tbody')).toContainText(jobName);
    
    // Verify job has PENDING status
    const jobRow = page.locator(`tr:has-text("${jobName}")`);
    await expect(jobRow.locator('[data-testid="status-badge"]')).toContainText('Pending');
  });

  test('should display job details correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Verify table headers
    const headers = ['ID', 'Name', 'Priority', 'Status', 'Progress', 'Created', 'Actions'];
    for (const header of headers) {
      await expect(page.locator('table thead')).toContainText(header);
    }
    
    // Verify at least one job is displayed
    const jobRows = page.locator('table tbody tr');
    await expect(jobRows).toHaveCountGreaterThan(0);
    
    // Check first job row has expected elements
    const firstRow = jobRows.first();
    await expect(firstRow.locator('td').nth(0)).toBeVisible(); // ID
    await expect(firstRow.locator('td').nth(1)).toBeVisible(); // Name
    await expect(firstRow.locator('td').nth(2)).toBeVisible(); // Priority
    await expect(firstRow.locator('td').nth(3)).toBeVisible(); // Status
    await expect(firstRow.locator('button:has-text("Edit Status")')).toBeVisible();
    await expect(firstRow.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('should update job status successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Find a job with PENDING status to update
    const pendingJobRow = page.locator('tr:has([data-testid="status-badge"]:has-text("Pending"))').first();
    await expect(pendingJobRow).toBeVisible();
    
    // Click Edit Status button
    await pendingJobRow.locator('button:has-text("Edit Status")').click();
    
    // Wait for status update modal
    await page.waitForSelector('[data-testid="status-update-modal"]', { timeout: 5000 });
    
    // Update status to RUNNING with progress
    await page.selectOption('select#status', 'RUNNING');
    await page.fill('textarea#message', 'Job is now running - E2E test');
    await page.fill('input#progress', '25');
    
    // Submit the update
    await page.click('button:has-text("Update Status")');
    
    // Wait for success toast
    await expect(page.locator('.toast-success')).toContainText('Job status updated to running');
    
    // Verify the status was updated in the table
    await expect(pendingJobRow.locator('[data-testid="status-badge"]')).toContainText('Running');
    
    // Verify progress is shown
    await expect(pendingJobRow).toContainText('25%');
  });

  test('should delete job with confirmation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Get initial job count
    const initialRowCount = await page.locator('table tbody tr').count();
    
    // Find a job to delete (use the specific test job)
    const testJobRow = page.locator('tr:has-text("Test Job for Automation")').first();
    
    // If the test job doesn't exist, create it first
    if (!(await testJobRow.isVisible())) {
      await page.fill('input[placeholder="Enter job name..."]', 'Test Job for Automation');
      await page.fill('textarea[placeholder="Enter job description..."]', 'Job created for deletion test');
      await page.click('button[type="submit"]:has-text("Create Job")');
      await page.waitForSelector('tr:has-text("Test Job for Automation")');
    }
    
    // Click Delete button
    await testJobRow.locator('button:has-text("Delete")').click();
    
    // Wait for confirmation modal
    await page.waitForSelector('[data-testid="confirm-modal"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="confirm-modal"]')).toContainText('Are you sure you want to delete');
    
    // Confirm deletion
    await page.click('button:has-text("Delete"):not(:has-text("Cancel"))');
    
    // Wait for success toast
    await expect(page.locator('.toast-success')).toContainText('Job deleted successfully');
    
    // Verify job is removed from the list
    await expect(page.locator('tr:has-text("Test Job for Automation")')).not.toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit empty form
    const createButton = page.locator('button[type="submit"]:has-text("Create Job")');
    await expect(createButton).toBeDisabled();
    
    // Enter only name (minimum required)
    await page.fill('input[placeholder="Enter job name..."]', 'Test Job');
    await expect(createButton).toBeEnabled();
    
    // Clear the name field
    await page.fill('input[placeholder="Enter job name..."]', '');
    await expect(createButton).toBeDisabled();
    
    // Enter whitespace only
    await page.fill('input[placeholder="Enter job name..."]', '   ');
    await expect(createButton).toBeDisabled();
  });

  test('should show loading states correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check initial loading state
    await page.waitForSelector('text=Loading jobs...', { timeout: 2000 });
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Test form loading state
    await page.fill('input[placeholder="Enter job name..."]', 'Loading Test Job');
    await page.click('button[type="submit"]:has-text("Create Job")');
    
    // Should briefly show "Creating..." text
    await expect(page.locator('button:has-text("Creating...")')).toBeVisible({ timeout: 1000 });
  });
});