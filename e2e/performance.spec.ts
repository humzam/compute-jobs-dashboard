import { test, expect } from './fixtures/test-fixtures';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

test.describe('Performance Tests', () => {
  test('should handle 1000+ jobs without performance degradation', async ({ page }) => {
    // Seed database with large dataset
    console.log('Creating large dataset...');
    await execAsync('cd backend && python manage.py seed_test_data --clear --count 1200');
    
    await page.goto('/');
    
    // Measure initial load time
    const startTime = Date.now();
    await page.waitForSelector('table tbody tr', { timeout: 30000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`Initial load time with 1200+ jobs: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    // Verify pagination is working
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Check page size options work correctly
    await page.selectOption('select#page-size', '50');
    await page.waitForTimeout(1000);
    
    const jobCount = await page.locator('table tbody tr').count();
    expect(jobCount).toBeLessThanOrEqual(50);
    
    // Test navigation performance
    const navStartTime = Date.now();
    await page.click('button:has-text("2")');
    await page.waitForSelector('button[aria-current="page"]:has-text("2")');
    const navTime = Date.now() - navStartTime;
    
    console.log(`Page navigation time: ${navTime}ms`);
    expect(navTime).toBeLessThan(2000); // Navigation should be fast
  });

  test('should search efficiently in large datasets', async ({ page }) => {
    // Use existing large dataset from previous test
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('table tbody tr', { timeout: 30000 });
    
    // Measure search performance
    const searchStartTime = Date.now();
    await page.fill('input[placeholder*="Search jobs"]', 'Processing');
    
    // Wait for debounced search to complete
    await page.waitForTimeout(1000);
    
    const searchTime = Date.now() - searchStartTime;
    console.log(`Search time: ${searchTime}ms`);
    expect(searchTime).toBeLessThan(3000); // Search should complete within 3 seconds
    
    // Verify search results are displayed
    const searchResults = await page.locator('table tbody tr').count();
    expect(searchResults).toBeGreaterThan(0);
    
    // Test filter performance
    const filterStartTime = Date.now();
    await page.selectOption('select#status-filter', 'PENDING');
    await page.waitForTimeout(1000);
    const filterTime = Date.now() - filterStartTime;
    
    console.log(`Filter time: ${filterTime}ms`);
    expect(filterTime).toBeLessThan(2000);
  });

  test('should handle rapid status updates efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    await page.waitForSelector('table tbody tr', { timeout: 30000 });
    
    // Perform multiple status updates to test performance
    const updateTimes = [];
    
    for (let i = 0; i < 3; i++) {
      const jobRow = page.locator('table tbody tr').nth(i);
      
      const updateStartTime = Date.now();
      
      await jobRow.locator('button:has-text("Edit Status")').click();
      await page.waitForSelector('[data-testid="status-update-modal"]');
      
      await page.selectOption('select#status', 'RUNNING');
      await page.fill('input#progress', String(25 + i * 25));
      await page.click('button:has-text("Update Status")');
      
      // Wait for success confirmation
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      await page.waitForTimeout(500); // Brief pause between updates
      
      const updateTime = Date.now() - updateStartTime;
      updateTimes.push(updateTime);
      console.log(`Status update ${i + 1} time: ${updateTime}ms`);
    }
    
    // Verify all updates completed in reasonable time
    const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
    expect(avgUpdateTime).toBeLessThan(3000); // Average update time under 3 seconds
  });

  test('should maintain responsiveness during real-time polling', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('table tbody tr', { timeout: 30000 });
    
    // Create some RUNNING jobs to trigger polling
    const jobRow = page.locator('table tbody tr').first();
    await jobRow.locator('button:has-text("Edit Status")').click();
    await page.waitForSelector('[data-testid="status-update-modal"]');
    await page.selectOption('select#status', 'RUNNING');
    await page.fill('input#progress', '30');
    await page.click('button:has-text("Update Status")');
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    
    // Wait for polling to start (should happen every 5 seconds)
    await page.waitForTimeout(2000);
    
    // Test UI responsiveness during polling
    const interactionStartTime = Date.now();
    
    // Try to interact with filters while polling is active
    await page.fill('input[placeholder*="Search jobs"]', 'Test Search');
    await page.selectOption('select#status-filter', 'RUNNING');
    
    const interactionTime = Date.now() - interactionStartTime;
    console.log(`UI interaction time during polling: ${interactionTime}ms`);
    expect(interactionTime).toBeLessThan(1000); // UI should remain responsive
    
    // Clear filters
    await page.fill('input[placeholder*="Search jobs"]', '');
    await page.selectOption('select#status-filter', '');
  });

  test('should handle concurrent user scenarios', async ({ browser }) => {
    // Simulate multiple users accessing the system
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);
    
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    
    try {
      // Load the application in all contexts simultaneously
      const loadPromises = pages.map(async (page, index) => {
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForSelector('table tbody tr', { timeout: 30000 });
        const loadTime = Date.now() - startTime;
        console.log(`Concurrent user ${index + 1} load time: ${loadTime}ms`);
        return loadTime;
      });
      
      const loadTimes = await Promise.all(loadPromises);
      const maxLoadTime = Math.max(...loadTimes);
      expect(maxLoadTime).toBeLessThan(10000); // Even under load, should load within 10 seconds
      
      // Perform concurrent operations
      const operationPromises = pages.map(async (page, index) => {
        // Each user performs different operations
        switch (index) {
          case 0:
            // User 1: Create jobs
            await page.fill('input[placeholder="Enter job name..."]', `Concurrent Job ${Date.now()}`);
            await page.click('button[type="submit"]:has-text("Create Job")');
            break;
          case 1:
            // User 2: Filter jobs
            await page.selectOption('select#status-filter', 'PENDING');
            await page.waitForTimeout(500);
            break;
          case 2:
            // User 3: Navigate pages
            if (await page.locator('button:has-text("2")').isVisible()) {
              await page.click('button:has-text("2")');
            }
            break;
        }
      });
      
      await Promise.all(operationPromises);
      
      // Verify all operations completed successfully
      for (const page of pages) {
        await expect(page.locator('table')).toBeVisible();
      }
      
    } finally {
      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
  });

  test('should measure and report core web vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure Time to Interactive (TTI) approximation
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('table tbody tr', { timeout: 30000 });
    
    // Ensure all interactive elements are ready
    await page.waitForSelector('button[type="submit"]:has-text("Create Job")');
    await page.waitForSelector('input[placeholder="Enter job name..."]');
    
    const tti = Date.now() - startTime;
    console.log(`Time to Interactive: ${tti}ms`);
    expect(tti).toBeLessThan(8000); // TTI should be under 8 seconds
    
    // Measure Largest Contentful Paint approximation
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    if (metrics > 0) {
      console.log(`Largest Contentful Paint: ${metrics}ms`);
      expect(metrics).toBeLessThan(4000); // LCP should be under 4 seconds
    }
    
    // Test responsiveness to user input
    const inputStartTime = Date.now();
    await page.fill('input[placeholder="Enter job name..."]', 'Performance Test Job');
    const inputResponseTime = Date.now() - inputStartTime;
    
    console.log(`Input response time: ${inputResponseTime}ms`);
    expect(inputResponseTime).toBeLessThan(100); // Input should be very responsive
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('table tbody tr', { timeout: 30000 });
    
    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform various operations to stress memory
    for (let i = 0; i < 5; i++) {
      await page.selectOption('select#page-size', '50');
      await page.waitForTimeout(500);
      
      await page.selectOption('select#page-size', '20');
      await page.waitForTimeout(500);
      
      await page.fill('input[placeholder*="Search jobs"]', `search ${i}`);
      await page.waitForTimeout(500);
      
      await page.fill('input[placeholder*="Search jobs"]', '');
      await page.waitForTimeout(500);
    }
    
    // Force garbage collection if possible
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Get final memory usage
    const finalMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    if (initialMetrics > 0 && finalMetrics > 0) {
      const memoryGrowth = finalMetrics - initialMetrics;
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);
      console.log(`Memory growth: ${memoryGrowthMB.toFixed(2)}MB`);
      
      // Memory growth should be reasonable (less than 50MB for these operations)
      expect(memoryGrowthMB).toBeLessThan(50);
    }
  });
});