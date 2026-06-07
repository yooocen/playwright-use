import { chromium } from 'playwright';

async function scrollUntilVisible(page: any, item: any) {
  for (let i = 0; i < 30; i++) {
    const visible = await item.isVisible().catch(() => false);
    if (visible) return;
    await page.evaluate(() => {
      const vl = document.querySelector('.rc-virtual-list-holder');
      if (vl) (vl as HTMLElement).scrollTop += 100;
    });
    await page.waitForTimeout(200);
  }
}

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];

  // 当前页面就是控制台首页
  const page = context.pages()[0];

  // 1. 搜索 ecs → 点击云服务器 ECS
  await page.locator('input[placeholder*="搜索"]').fill('ecs');
  await page.waitForTimeout(1500);
  await page.getByText('云服务器 ECS').first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(3000);
  // 关闭搜索面板，避免遮挡后续点击
  await page.waitForTimeout(1000);
  // 关闭搜索面板
  await page.evaluate(() => {
    const panel = document.querySelector('[data-spm="console-base_search-panel"]');
    if (panel) (panel as HTMLElement).style.display = 'none';
  });
  await page.waitForTimeout(500);

  // 2. 找到 ECS 页面 → 点击资源报表
  let ecsPage = context.pages().find(p => p.url().includes('ecs.console')) || page;
  await ecsPage.getByRole('tab', { name: '资源报表' }).evaluate(el => (el as HTMLElement).click());
  await ecsPage.waitForTimeout(1000);

  // 3. 点击地域下拉 → 滚动找到菲律宾
  await ecsPage.getByText('地域').nth(1).evaluate(el => (el as HTMLElement).click());
  await ecsPage.waitForTimeout(500);
  const item = ecsPage.getByText('菲律宾（马尼拉）');
  await scrollUntilVisible(ecsPage, item);
  await item.click();

  await ecsPage.waitForTimeout(2000);

  // 4. 打印实例总数
  const instanceCount = await ecsPage.evaluate(() => {
    const el = document.querySelector('.ca-amount-content-w');
    return el?.textContent?.trim() || 'not found';
  });
  console.log('实例总数:', instanceCount);

  await browser.close();
})();
