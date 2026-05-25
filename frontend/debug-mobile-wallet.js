const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  
  try {
    await page.goto('http://127.0.0.1:3119');
    await page.waitForTimeout(2000);
    
    console.log('=== All buttons on the page ===');
    const buttons = await page.locator('button').all();
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      const isVisible = await btn.isVisible();
      console.log(`Button ${i}: text="${text}", aria-label="${ariaLabel}", visible=${isVisible}`);
    }
    
    console.log('\n=== Looking for connect wallet button ===');
    try {
      const connectBtn = page.getByRole('button', { name: /connect wallet/i });
      const isAttached = await connectBtn.isAttached();
      const isVisible = await connectBtn.isVisible();
      console.log(`Connect wallet button found: attached=${isAttached}, visible=${isVisible}`);
    } catch (e) {
      console.log('Connect wallet button not found:', e.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
