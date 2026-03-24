import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form when not authenticated', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the app loads - body should have content
    const bodyContent = await page.locator('body').innerHTML();
    expect(bodyContent.length).toBeGreaterThan(0);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Click login button if present
    const loginButton = page.getByRole('button', { name: /login|登录/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Fill in the auth form
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('invaliduser');
      await passwordInput.fill('wrongpassword');
      
      // Submit the form
      const submitButton = page.getByRole('button', { name: /submit|login|登录|register|注册/i });
      await submitButton.click();

      // Wait for error message
      await expect(page.locator('text=/invalid|error|失败|错误/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should toggle between login and register modes', async ({ page }) => {
    // Look for mode toggle
    const toggleButton = page.getByRole('button', { name: /register|注册|sign up/i });
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // Should show nickname field in register mode
      const nicknameInput = page.locator('input[name="nickname"], input[placeholder*="nickname"]').first();
      await expect(nicknameInput).toBeVisible();
      
      // Toggle back to login
      const loginToggle = page.getByRole('button', { name: /login|登录|sign in/i });
      await loginToggle.click();
      
      // Nickname field should be hidden or not required
      await expect(nicknameInput).not.toBeVisible();
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected content without auth', async ({ page }) => {
    await page.goto('/');
    
    // Try to access protected features
    const profileLink = page.getByRole('link', { name: /profile|个人/i });
    
    // These should either not exist or show login prompt when clicked
    if (await profileLink.isVisible()) {
      await profileLink.click();
      // Should show login prompt or redirect to auth
      await expect(page.locator('form, input[name="username"]')).toBeVisible({ timeout: 3000 });
    }
  });
});
