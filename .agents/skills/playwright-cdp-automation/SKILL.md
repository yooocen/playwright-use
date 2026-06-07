---
name: playwright-cdp-automation
description: Use when automating browser interactions via Playwright connectOverCDP, such as Aliyun console, admin panels, or SPA dashboards with virtual scrolling dropdowns
---

# Playwright CDP 自动化

## 概述

通过 CDP（`--remote-debugging-port=9222`）连接已有 Chrome 浏览器并用 Playwright 自动化操作。适用于需要手动登录的控制台操作、一次性自动化脚本等场景。

## 核心模式

```typescript
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  // ... 自动化操作 ...
  await browser.close();
})();
```

## 常用技巧

### 找到目标页面

```typescript
const page = context.pages().find(p => p.url().includes('console'));
const homepage = context.pages().find(p => !p.url().includes('console'));
```

### 点击视口外的元素

搜索结果下拉等元素可能渲染在视口外，Playwright 的 `click()` 会失败：

```typescript
// ❌ 报错: "Element is outside of the viewport"
await page.getByText('云服务器 ECS').first().click();

// ✅ 用 evaluate 触发原生 click
await page.getByText('云服务器 ECS').first().evaluate(el => (el as HTMLElement).click());
```

### 处理虚拟滚动下拉菜单

阿里云 ECS 地域选择等使用 `rc-virtual-list`（虚拟滚动），未滚动到的项不在 DOM 中：

```typescript
await page.getByText('地域').nth(1).evaluate(el => (el as HTMLElement).click());

const item = page.getByText('菲律宾（马尼拉）');
for (let i = 0; i < 30; i++) {
  const visible = await item.isVisible().catch(() => false);
  if (visible) break;
  await page.evaluate(() => {
    const vl = document.querySelector('.rc-virtual-list-holder');
    if (vl) (vl as HTMLElement).scrollTop += 100;
  });
  await page.waitForTimeout(200);
}
await item.click();
```

**注意：** 步长用 100px，太大（如 300px）可能跳过目标项。

### 关闭遮挡元素

搜索面板等弹出层会遮挡后续点击，可用 evaluate 移除：

```typescript
await page.evaluate(() => {
  const panel = document.querySelector('[data-spm="console-base_search-panel"]');
  if (panel) (panel as HTMLElement).style.display = 'none';
});
```

### 处理新窗口（popup）

```typescript
const popupPromise = page.waitForEvent('popup', { timeout: 15000 });
await page.getByRole('link', { name: '控制台', exact: true }).click();
const popup = await popupPromise;
await popup.waitForLoadState('load');
```

### 控制台搜索与导航

```typescript
await page.locator('input[placeholder*="搜索"]').fill('ecs');
await page.waitForTimeout(1500);
await page.getByText('云服务器 ECS').first().evaluate(el => (el as HTMLElement).click());
await page.waitForTimeout(5000);
const ecsPage = context.pages().find(p => p.url().includes('ecs.console')) || page;
```

## 执行方式

```bash
google-chrome --remote-debugging-port=9222  # 启动浏览器
# 手动登录后执行：
npx tsx script.ts
```

## 常见问题

| 问题 | 解决 |
|------|------|
| `waitForLoadState('networkidle')` 超时 | 改用 `'load'`（控制台页面有轮询请求） |
| 元素在视口外无法点击 | 用 `evaluate(el => el.click())` |
| 下拉菜单找不到选项 | 以 100px 步长滚动 `.rc-virtual-list-holder` |
| Popup 超时 | 当前页面不对，先检查 `context.pages()` |
| 提示登录 | 在浏览器中手动登录后再跑脚本 |
| 搜索面板遮挡后续点击 | 用 evaluate 移除 `[data-spm="console-base_search-panel"]` |
