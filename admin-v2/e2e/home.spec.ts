import { test, expect } from '@playwright/test';

test('has title and renders home page', async ({ page }) => {
  await page.goto('/');

  // Check that the page loads and has a title (you can modify this generic check later)
  await expect(page).toHaveTitle(/Lab Shop Manager - Tablets/i); // Adjust standard title matching based on app later
});
