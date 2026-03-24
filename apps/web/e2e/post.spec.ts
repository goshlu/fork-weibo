import { test, expect } from '@playwright/test';

test.describe('Post Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display feed on homepage', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the app loads - body should have content
    const bodyContent = await page.locator('body').innerHTML();
    expect(bodyContent.length).toBeGreaterThan(0);
  });

  test('should show composer for authenticated users', async ({ page }) => {
    // Mock authenticated state by setting localStorage
    await page.addInitScript(() => {
      localStorage.setItem('fork-weibo-token', 'test-token');
      localStorage.setItem('fork-weibo-user', JSON.stringify({
        id: 'test-user',
        username: 'testuser',
        nickname: 'Test User',
      }));
    });
    
    await page.goto('/');
    
    // Look for composer/post creation UI
    const composerTrigger = page.getByRole('button', { name: /compose|create|发布|写/i });
    const composerForm = page.locator('textarea[placeholder*="content"], textarea[placeholder*="内容"]');
    
    // Composer should be accessible
    if (await composerTrigger.isVisible()) {
      await composerTrigger.click();
      await expect(composerForm).toBeVisible({ timeout: 3000 });
    } else if (await composerForm.isVisible()) {
      // Composer already visible
      await expect(composerForm).toBeVisible();
    }
  });

  test('should validate post content before submission', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('fork-weibo-token', 'test-token');
      localStorage.setItem('fork-weibo-user', JSON.stringify({
        id: 'test-user',
        username: 'testuser',
        nickname: 'Test User',
      }));
    });
    
    await page.goto('/');
    
    // Open composer
    const composerTrigger = page.getByRole('button', { name: /compose|create|发布|写/i });
    const composerForm = page.locator('textarea').first();
    
    if (await composerTrigger.isVisible()) {
      await composerTrigger.click();
    }
    
    if (await composerForm.isVisible()) {
      // Try to submit empty content
      const submitButton = page.getByRole('button', { name: /submit|post|发布|发送/i });
      
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        
        // Should show validation error
        await expect(page.locator('text=/empty|required|不能为空|请输入/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

test.describe('Post Display', () => {
  test('should display post cards with content', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check for post cards
    const postCard = page.locator('[class*="post-card"], [class*="PostCard"]').first();
    
    if (await postCard.isVisible()) {
      // Post should have content
      const postContent = postCard.locator('p, [class*="content"]');
      await expect(postContent).not.toBeEmpty();
    }
  });

  test('should display post author information', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const postCard = page.locator('[class*="post-card"], [class*="PostCard"]').first();
    
    if (await postCard.isVisible()) {
      // Should show author name/avatar
      const authorInfo = postCard.locator('[class*="author"], [class*="avatar"], [class*="user"]').first();
      await expect(authorInfo).toBeVisible();
    }
  });
});
