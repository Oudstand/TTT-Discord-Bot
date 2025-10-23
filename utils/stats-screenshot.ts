// utils/stats-screenshot.ts
import {chromium, Browser, Page} from "playwright";
import {ScreenshotPath, StatsType} from "../types";

async function screenshotStats(type: StatsType = 'all', filename: ScreenshotPath = 'stats_all.png'): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        // Use 'msedge' channel on Windows to use pre-installed Edge browser
        // Fallback to bundled Chromium if Edge not found
        browser = await chromium.launch({
            headless: true,
            channel: 'msedge'
        }).catch(() => {
            console.log('⚠️  Edge not found, falling back to bundled Chromium');
            return chromium.launch({headless: true});
        });

        page = await browser.newPage();
        await page.setViewportSize({width: 1600, height: 900});

        const tableId = type === 'session' ? '#statsTableSession' : '#statsTableAll';
        const url = 'http://localhost:3000/';

        await page.goto(url, {waitUntil: 'networkidle'});
        await page.waitForSelector(`${tableId} tr`);
        await page.waitForFunction(
            (sel) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const rows = el.querySelectorAll('tr');
                return rows.length > 1 && (el as HTMLElement).offsetParent !== null;
            }, tableId);

        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            el?.scrollIntoView({block: 'center', inline: 'center'});
        }, tableId);

        const statsElement = await page.locator(tableId);
        if (await statsElement.count() > 0) {
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