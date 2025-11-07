// utils/stats-screenshot.ts
import puppeteer, {Browser, Page} from "puppeteer";
import {ScreenshotPath, StatsType} from "../types";
import config from "../config";

async function screenshotStats(type: StatsType = 'all', filename: ScreenshotPath = 'stats_all.png'): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();
        await page.setViewport({width: 1600, height: 900});

        const tableId = type === 'session' ? '#statsTableSession' : '#statsTableAll';
        const language = config.language || 'en';
        const url = `http://localhost:3000/?lang=${language}`;

        await page.goto(url, {waitUntil: 'networkidle0'});
        await page.waitForSelector(`${tableId} tr`);
        await page.waitForFunction(
            (sel) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const rows = el.querySelectorAll('tr');
                return rows.length > 1 && (el as HTMLElement).offsetParent !== null;
            }, {}, tableId);

        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            el?.scrollIntoView({block: 'center', inline: 'center'});
        }, tableId);

        const statsElement = await page.$(tableId);
        if (statsElement) {
            await statsElement.screenshot({path: filename});
        } else {
            console.error('❌ Table not found – taking full-page screenshot.');
            await page.screenshot({path: filename, fullPage: true});
        }
    } catch (error) {
        console.error('❌ Error creating screenshot:', error);
    } finally {
        try { await page?.close(); } catch {}
        try { await browser?.close(); } catch {}
    }
}

export {screenshotStats};