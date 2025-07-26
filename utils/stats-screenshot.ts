// utils/stats-screenshot.ts
import puppeteer, {Browser, Page} from 'puppeteer';
import config from '../config';
import {ScreenshotPath, StatsType} from "../types";


async function screenshotStats(type: StatsType = 'all', filename: string = 'stats_all.png'): Promise<void> {
    if (!config.CHROMIUM_PATH) {
        console.error("❌ Chromium-Pfad (CHROMIUM_PATH) ist nicht in der Konfiguration gesetzt. Screenshot kann nicht erstellt werden.");
        return;
    }

    let browser: Browser | null = null;

    try {
        browser = await puppeteer.launch({executablePath: config.CHROMIUM_PATH});
        const page: Page = await browser.newPage();
        const tableId = type === 'session' ? '#statsTableSession' : '#statsTableAll';
        const url = 'http://localhost:3000/';

        await page.setViewport({width: 1600, height: 900});
        await page.goto(url, {waitUntil: 'networkidle2'});
        await page.waitForSelector(`${tableId} tr`, {timeout: 4000});
        await new Promise(resolve => setTimeout(resolve, 300));

        const statsElement = await page.$(tableId);
        if (statsElement) {
            await statsElement.screenshot({path: filename as ScreenshotPath});
        } else {
            console.error('❌ #statsTable nicht auf der Seite gefunden. Mache einen Screenshot der ganzen Seite.');
            await page.screenshot({path: filename as ScreenshotPath, fullPage: true});
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Screenshots:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export {screenshotStats};