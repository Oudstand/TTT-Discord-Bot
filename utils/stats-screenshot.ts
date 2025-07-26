// utils/stats-screenshot.ts
import puppeteer, {Browser, Page} from "puppeteer";
import {ScreenshotPath, StatsType} from "../types";

async function screenshotStats(type: StatsType = 'all', filename: ScreenshotPath = 'stats_all.png'): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        browser = await puppeteer.launch({headless: true});

        page = await browser.newPage();
        page.setDefaultNavigationTimeout(10_000);
        page.setDefaultTimeout(8_000);
        await page.setViewport({width: 1600, height: 900});

        const tableId = type === 'session' ? '#statsTableSession' : '#statsTableAll';
        const url = 'http://localhost:3000/';

        await page.goto(url, {waitUntil: 'networkidle2'});
        await page.waitForSelector(`${tableId} tr`);
        await page.waitForFunction(
            (sel) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const rows = el.querySelectorAll('tr');
                return rows.length > 1 && (el as HTMLElement).offsetParent !== null;
            }, {}, tableId);
        await page.$eval(tableId, (el) =>
            el.scrollIntoView({block: 'center', inline: 'center'})
        );

        const statsElement = await page.$(tableId);
        if (statsElement) {
            await statsElement.screenshot({path: filename});
        } else {
            console.error('❌ Tabelle nicht gefunden – mache Full-Page-Screenshot.');
            await page.screenshot({path: filename, fullPage: true});
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Screenshots:', error);
    } finally {
        try { await page?.close(); } catch {}
        try { await browser?.close(); } catch {}
    }
}

export {screenshotStats};