// utils/stats-screenshot.ts
import {chromium, Browser, Page} from "playwright";
import {ScreenshotPath, StatsType} from "../types";
import {existsSync} from "fs";
import {join, dirname} from "path";

function getChromiumPath(): string | undefined {
    // Check if running as compiled executable with bundled Chromium
    const exeDir = dirname(process.execPath);
    const bundledChromiumDir = join(exeDir, 'chromium');

    if (existsSync(bundledChromiumDir)) {
        // On Windows, Chromium executable is in chrome-win/chrome.exe
        const chromiumExe = join(bundledChromiumDir, 'chrome.exe');
        if (existsSync(chromiumExe)) {
            console.log('✅ Using bundled Chromium:', chromiumExe);
            return chromiumExe;
        }
    }

    // Fallback to system-installed Chromium (development mode)
    console.log('🔎 Using system Chromium (playwright cache)');
    return undefined;
}

async function screenshotStats(type: StatsType = 'all', filename: ScreenshotPath = 'stats_all.png'): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        const chromiumPath = getChromiumPath();
        browser = await chromium.launch({
            headless: true,
            executablePath: chromiumPath
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