import { test, expect } from '@playwright/test';
import { setupAPIMocks } from './api-mocks';

test.describe('Basic Frontend Tests', () => {
  test('should load the homepage with mocked data', async ({ page }) => {
    // Set up API mocks
    await setupAPIMocks(page);
    
    // Navigate to the home page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the header is visible
    await expect(page.locator('header')).toBeVisible();
    
    // Job form should be present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[placeholder*="job name"]')).toBeVisible();
    
    // Should show the jobs table with mock data
    await expect(page.locator('table')).toBeVisible();
  });

  test('should be responsive and accessible', async ({ page }) => {
    await setupAPIMocks(page);
    await page.goto('/');
    
    // Test basic accessibility
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Test responsive behavior by changing viewport
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    await page.waitForTimeout(1000);
    
    // Page should still be functional on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});