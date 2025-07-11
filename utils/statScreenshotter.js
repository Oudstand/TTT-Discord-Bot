// utils/statScreenshotter.js
const puppeteer = require('puppeteer');

async function screenshotStats() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/', {waitUntil: 'networkidle2'});

    const statsElement = await page.$('#statsTable'); // Passe die Klasse an!
    if (statsElement) {
        await statsElement.screenshot({ path: 'stats.png' });
    } else {
        await page.screenshot({ path: 'stats.png' });
    }

    await browser.close();
}

module.exports = {screenshotStats};