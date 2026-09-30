import { test, expect } from './fixtures';

test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'A captura usa dados visuais determinísticos.');

test('gera uma screenshot reproduzível da tela principal', async ({ page, heroApi: _heroApi }) => {
  await page.setViewportSize({ width: 1600, height: 1050 });
  await page.goto('/');
  await expect(page.getByText('Solaris', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/hero-factory-home.png', fullPage: true });
});
