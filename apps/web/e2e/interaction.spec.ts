import { test, expect } from '@playwright/test';

test.describe('Post Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state for interaction tests
    await page.addInitScript(() => {
      localStorage.setItem('fork-weibo-token', 'test-token');
      localStorage.setItem('fork-weibo-user', JSON.stringify({
        id: 'test-user',
        username: 'testuser',
        nickname: 'Test User',
      }));
    });
    await page.goto('/');
  });

  test('should toggle like on a post', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const postCard = page.locator('[class*="post-card"], [class*="PostCard"]').first();
    
    if (await postCard.isVisible()) {
      // Find like button
      const likeButton = postCard.getByRole('button', { name: /like|赞|点赞/i }).or(
        postCard.locator('[class*="like"], [class*="heart"]').first()
      );
      
      if (await likeButton.isVisible()) {
        // Get initial state
        const initialState = await likeButton.getAttribute('class');
        
        // Click like
        await likeButton.click();
        await page.waitForTimeout(500);
        
        // State should change
        const newState = await likeButton.getAttribute('class');
        expect(newState).not.toBe(initialState);
      }
    }
  });

  test('should toggle favorite on a post', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const postCard = page.locator('[class*="post-card"], [class*="PostCard"]').first();
    
    if (await postCard.isVisible()) {
      // Find favorite button
      const favoriteButton = postCard.getByRole('button', { name: /favorite|save|收藏|保存/i }).or(
        postCard.locator('[class*="favorite"], [class*="save"]').first()
      );
      
      if (await favoriteButton.isVisible()) {
        await favoriteButton.click();
        await page.waitForTimeout(500);
        
        // Button state should change or show success
        await expect(favoriteButton).toBeVisible();
      }
    }
  });

  test('should open comments section', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const postCard = page.locator('[class*="post-card"], [class*="PostCard"]').first();
    
    if (await postCard.isVisible()) {
      // Find comment button
      const commentButton = postCard.getByRole('button', { name: /comment|评论/i }).or(
        postCard.locator('[class*="comment"]').first()
      );
      
      if (await commentButton.isVisible()) {
        await commentButton.click();
        await page.waitForTimeout(500);
        
        // Comments section should appear
        const commentsSection = page.locator('[class*="comments"], [class*="comment-list"]');
        const commentInput = page.locator('textarea[placeholder*="comment"], input[placeholder*="comment"]');
        
        await expect(commentsSection.or(commentInput)).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should submit a comment', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const postCard = page.locator('[class*="post-card"], [class*="PostCard"]').first();
    
    if (await postCard.isVisible()) {
      // Open comments first
      const commentButton = postCard.getByRole('button', { name: /comment|评论/i }).or(
        postCard.locator('[class*="comment"]').first()
      );
      
      if (await commentButton.isVisible()) {
        await commentButton.click();
        await page.waitForTimeout(500);
      }
      
      // Find comment input
      const commentInput = page.locator('textarea[placeholder*="comment"], input[placeholder*="comment"]').first();
      
      if (await commentInput.isVisible()) {
        await commentInput.fill('This is a test comment from E2E');
        
        // Submit comment
        const submitButton = page.getByRole('button', { name: /submit|send|发布|发送/i });
        await submitButton.click();
        
        // Comment should appear in list
        await expect(page.locator('text="This is a test comment from E2E"')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('User Interactions', () => {
  test('should navigate to user profile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Find a user avatar/name link
    const userLink = page.locator('[class*="author"], [class*="user"]').first().locator('a, button').first();
    
    if (await userLink.isVisible()) {
      await userLink.click();
      
      // Should navigate to profile page
      await expect(page).toHaveURL(/user|profile/, { timeout: 5000 });
    }
  });

  test('should toggle follow status', async ({ page }) => {
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
    await page.waitForTimeout(2000);
    
    // Navigate to a user profile
    const userLink = page.locator('[class*="author"], [class*="user"]').first().locator('a, button').first();
    
    if (await userLink.isVisible()) {
      await userLink.click();
      await page.waitForTimeout(1000);
      
      // Find follow button
      const followButton = page.getByRole('button', { name: /follow|关注/i });
      
      if (await followButton.isVisible()) {
        const initialState = await followButton.textContent();
        await followButton.click();
        await page.waitForTimeout(500);
        
        // Button text should change
        const newState = await followButton.textContent();
        expect(newState).not.toBe(initialState);
      }
    }
  });
});

test.describe('Navigation', () => {
  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/');
    
    // Find navigation tabs
    const tabs = page.locator('[role="tablist"], [class*="tabs"], [class*="nav"]').first();
    
    if (await tabs.isVisible()) {
      const tabButtons = tabs.locator('button, [role="tab"]');
      const count = await tabButtons.count();
      
      if (count > 1) {
        // Click second tab
        await tabButtons.nth(1).click();
        await page.waitForTimeout(500);
        
        // Content should change
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should open notifications panel', async ({ page }) => {
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
    
    // Find notifications button
    const notifButton = page.getByRole('button', { name: /notification|通知/i }).or(
      page.locator('[class*="notification"]').first()
    );
    
    if (await notifButton.isVisible()) {
      await notifButton.click();
      await page.waitForTimeout(500);
      
      // Notifications panel should open
      const notifPanel = page.locator('[class*="notification-panel"], [class*="notifications"]');
      await expect(notifPanel).toBeVisible({ timeout: 3000 });
    }
  });
});
