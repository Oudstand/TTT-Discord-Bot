// utils/statsScreenshot.js
import puppeteer from 'puppeteer';
import config from '../config.js';

async function screenshotStats(type = 'all', filename = 'stats_all.png') {
    const browser = await puppeteer.launch({ executablePath: config.CHROMIUM_PATH });
    const page = await browser.newPage();

    let url = 'http://localhost:3000/';
    if (type === 'session') url += '?stats=session';

    await page.setViewport({ width: 1600, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#statsTable tr', { timeout: 4000 });
    await new Promise(resolve => setTimeout(resolve, 200));

    const statsElement = await page.$('#statsTable');
    if (statsElement) {
        await statsElement.screenshot({ path: filename });
    } else {
        await page.screenshot({ path: filename });
    }

    await browser.close();
}

export { screenshotStats };