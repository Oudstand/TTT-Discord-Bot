// utils/statScreenshotter.js
const puppeteer = require('puppeteer');

async function screenshotStats() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({width: 1600, height: 900});
    await page.goto('http://localhost:3000/', {waitUntil: 'networkidle2'});

    const statsElement = await page.$('#statsTable');
    if (statsElement) {
        await statsElement.screenshot({ path: 'stats.png' });
    } else {
        await page.screenshot({ path: 'stats.png' });
    }

    await browser.close();
}

module.exports = {screenshotStats};