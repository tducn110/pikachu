import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 2,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  try {
    console.log("Navigating to http://localhost:5174/...");
    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(3000);
    
    console.log("Clicking the mobile dashboard button...");
    const dashboardButton = page.locator('button.hyper-action-orb-mobile[aria-label="Mở bảng xếp hạng"]');
    if (await dashboardButton.isVisible()) {
      await dashboardButton.click();
      console.log("Clicked! Waiting for overlay...");
      await page.waitForTimeout(2000);
    } else {
      console.log("Dashboard button not found or not visible!");
    }

    await page.screenshot({ path: 'screenshot.png' });
    console.log("Screenshot saved to screenshot.png");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
})();
