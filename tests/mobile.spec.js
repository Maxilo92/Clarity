const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

async function login(page) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'e2e@clarity.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
}

test.describe('Mobile Baseline', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await login(page);
    });

    test('Dashboard stays usable on smartphone', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Clarity Dashboard');
        await expect(page.locator('.sidebar .menu')).toBeVisible();

        const bodyOverflow = await page.evaluate(() => ({
            html: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            body: document.body.scrollWidth - document.body.clientWidth
        }));

        // Horizontal overflow should remain controlled on mobile.
        expect(bodyOverflow.html).toBeLessThanOrEqual(8);
        expect(bodyOverflow.body).toBeLessThanOrEqual(8);

        await expect(page.locator('.table-scroll')).toBeVisible();
        await expect(page.locator('.diamond-btn')).toBeVisible();
    });

    test('Insights controls remain tap-friendly', async ({ page }) => {
        await page.goto(`${BASE_URL}/insights`);

        await expect(page.locator('h1')).toContainText('Financial Insights');
        await expect(page.locator('#insightsTimeframe')).toBeVisible();
        await expect(page.locator('#refreshInsights')).toBeVisible();

        const profileChip = page.locator('.profile-chip').first();
        await expect(profileChip).toBeVisible();

        const bounding = await profileChip.boundingBox();
        expect(bounding).not.toBeNull();
        expect(bounding.height).toBeGreaterThanOrEqual(40);
    });

    test('Support form remains accessible', async ({ page }) => {
        await page.goto(`${BASE_URL}/support`);

        await expect(page.locator('h1')).toContainText('Clarity Support');
        await expect(page.locator('#supportSubject')).toBeVisible();
        await expect(page.locator('#supportMessage')).toBeVisible();
        await expect(page.locator('#btnSendSupport')).toBeVisible();

        await page.fill('#supportSubject', 'Mobile test request');
        await page.fill('#supportMessage', 'Checking smartphone support baseline.');
        await expect(page.locator('#supportSubject')).toHaveValue('Mobile test request');
    });

    test('Clair chat opens mobile-ready', async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard`);

        const trigger = page.locator('.diamond-btn').first();
        await expect(trigger).toBeVisible();
        await trigger.click();

        await expect(page.locator('#aiChatPanel')).toHaveClass(/open/);
        await expect(page.locator('body')).toHaveClass(/clair-chat-open/);
        await expect(page.locator('#aiChatInput')).toBeVisible();
        await expect(page.locator('#aiChatSend')).toBeVisible();
        await expect(page.locator('#aiChatClose')).toBeVisible();

        const sendBounds = await page.locator('#aiChatSend').boundingBox();
        expect(sendBounds).not.toBeNull();
        expect(sendBounds.height).toBeGreaterThanOrEqual(44);

        const disclaimer = page.locator('.ai-chat-disclaimer');
        await expect(disclaimer).toBeVisible();

        // Wait for panel transition to complete before geometric viewport checks.
        await page.waitForTimeout(750);
        const disclaimerBounds = await disclaimer.boundingBox();
        const viewport = page.viewportSize();
        expect(disclaimerBounds).not.toBeNull();
        expect(disclaimerBounds.y + disclaimerBounds.height).toBeLessThanOrEqual(viewport.height + 2);
    });
});
