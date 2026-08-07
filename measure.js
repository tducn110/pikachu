import puppeteer from 'puppeteer';

const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 844, height: 390 }
];

async function measure() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const vp of viewports) {
    await page.setViewport(vp);
    await page.goto('http://localhost:5180', { waitUntil: 'networkidle2' });
    
    // measure dimensions
    const dims = await page.evaluate(() => {
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      const hud = isDesktop 
        ? document.querySelector('aside')
        : document.querySelector('.game-mobile-header');
      const boardFrame = document.querySelector('.game-board-frame');
      const canvas = document.querySelector('canvas');
      const main = document.querySelector('main');
      
      return {
        main: main ? { w: main.clientWidth, h: main.clientHeight, sh: main.scrollHeight } : null,
        hud: hud ? { w: hud.clientWidth, h: hud.clientHeight } : null,
        boardFrame: boardFrame ? { w: boardFrame.clientWidth, h: boardFrame.clientHeight } : null,
        canvas: canvas ? { w: canvas.clientWidth, h: canvas.clientHeight } : null,
      };
    });

    console.log(`Viewport: ${vp.width}x${vp.height}`);
    console.log(`HUD: ${dims.hud?.w}x${dims.hud?.h}`);
    console.log(`Gameplay frame: ${dims.boardFrame?.w}x${dims.boardFrame?.h}`);
    console.log(`Canvas: ${dims.canvas?.w}x${dims.canvas?.h}`);
    console.log(`Main Scroll Height: ${dims.main?.sh}, Client Height: ${dims.main?.h}`);
    console.log('---');
  }

  await browser.close();
}
measure();
