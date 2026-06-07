---
name: aliyuntest
description: Use when automating Aliyun console operations via CDP-connected Chrome, requiring manual login first then running automated tests
---

# Aliyun 自动化测试

## 概述

通过 CDP 连接已打开的 Chrome 浏览器，手动登录阿里云后自动执行测试脚本获取 ECS 实例信息。

## 工作流程

### 1. 启动调试浏览器
先检查调试浏览器是否打开，如果已经打开执行执行第2步

先检查当前是在window下面还是wsl下面，再按需执行下面的命令

```bash
# WSL 启动 Chrome 调试模式
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/temp/chrome-debug"

# Windows 启动 Edge 调试模式
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir=C:/temp/chrome-debug
```

### 2. 打开阿里云并等待登录

执行以下脚本，它会自动打开阿里云首页，检测登录状态。如果未登录则跳转到登录页，然后每隔 3 秒轮询直到用户登录完成：

```bash
cd /home/cyd/playwright-use && npx tsx -e "
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes('aliyun.com'));
  if (!page) { page = await ctx.newPage(); await page.goto('https://www.aliyun.com/'); }
  await page.waitForTimeout(3000);

  const checkLogin = () => page.evaluate(() =>
    document.querySelector('[class*=\"avatar\"], [class*=\"user-info\"]') !== null
  );

  if (await checkLogin()) {
    console.log('已登录');
  } else {
    const btn = page.getByText('登录').first();
    if (await btn.isVisible().catch(() => false)) await btn.click();
    else await page.goto('https://signin.aliyun.com/login.htm');
    console.log('请在浏览器中手动登录...');
    for (let i = 0; i < 120; i++) {
      if (await checkLogin()) { console.log('登录成功'); break; }
      await page.waitForTimeout(3000);
    }
  }
  await browser.close();
})();
"
```

### 3. 执行自动化脚本

```bash
cd /home/cyd/playwright-use && npx tsx aliyun.test.spec.ts
```

脚本会自动：
- 连接 `localhost:9222` 的调试浏览器
- 导航到阿里云 ECS 控制台
- 搜索并进入 ECS 资源报表
- 选择地域 "菲律宾（马尼拉）"
- 输出实例总数

### 4. 获取结果

终端输出的 `实例总数: N` 即为结果，告知用户。

## 前提条件

- Chrome/Edge 以 `--remote-debugging-port=9222` 启动
- 项目中已安装 playwright 和 tsx
- 阿里云账号

## 常见问题

| 问题 | 解决 |
|------|------|
| `connect ECONNREFUSED 127.0.0.1:9222` | Chrome 未以调试模式启动 |
| `Cannot find name 'Page'` | 确保脚本内联使用 `import { chromium }` |
| 找不到控制台页面 | 确认已登录且能访问 home.console.aliyun.com |
| 元素点击失败 | 用 `evaluate(el => el.click())` 触发原生 click |
| 脚本超时 | 页面加载慢，可增加 waitForTimeout |
