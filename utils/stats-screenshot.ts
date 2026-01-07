// utils/stats-screenshot.ts
import puppeteer, {Browser, Page} from 'puppeteer-core';
import {ScreenshotPath, StatsType} from '../types';
import config from '../config';
import {t, Language} from '../i18n/translations';
import {ensureChromiumInstalled} from './chromium-downloader';

function lang(): Language {
    return (config.language || 'en') as Language;
}

let portableChromium: { executablePath: string } | null = null;
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser | null> {
    if (browserInstance &&  browserInstance.connected) {
        return browserInstance;
    }

    // Ensure portable Chromium Headless Shell is available
    if (!portableChromium) {
        portableChromium = await ensureChromiumInstalled();
    }

    if (!portableChromium) {
        console.error(`❌ ${t('screenshot.chromiumFailed', lang())}`);
        return null;
    }

    try {
        browserInstance = await puppeteer.launch({
            executablePath: portableChromium.executablePath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        // Ensure browser is closed when process exits
        process.on('exit', async () => {
            if (browserInstance) {
                await browserInstance.close();
            }
        });

        return browserInstance;
    } catch (error: any) {
        console.error(`❌ ${t('screenshot.launchFailed', lang())}`, error.message);
        return null;
    }
}

async function screenshotStats(type: StatsType = 'all', filename: ScreenshotPath = 'stats_all.png'): Promise<void> {
    let page: Page | null = null;
    const browser = await getBrowser();

    if (!browser) {
        return;
    }

    try {
        page = await browser.newPage();
        await page.setViewport({width: 1600, height: 900});

        const tableId = type === 'session' ? '#statsTableSession' : '#statsTableAll';
        const language = config.language || 'en';
        const url = `http://localhost:3000/?lang=${language}`;

        await page.goto(url, {waitUntil: 'networkidle0'});
        await page.waitForSelector(`${tableId} tr`);

        // Wait for table to be visible and have data
        await page.waitForFunction(
            (sel) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const rows = el.querySelectorAll('tr');
                return rows.length > 1 && (el as HTMLElement).offsetParent !== null;
            }, {}, tableId);

        // Scroll element into view
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            el?.scrollIntoView({block: 'center', inline: 'center'});
        }, tableId);

        const statsElement = await page.$(tableId);
        if (statsElement) {
            await statsElement.screenshot({path: filename});
        } else {
            console.error(`❌ ${t('screenshot.tableNotFound', lang())}`);
            await page.screenshot({path: filename, fullPage: true});
        }
    } catch (error) {
        console.error(`❌ ${t('screenshot.errorCreating', lang())}`, error);
    } finally {
        try {
            await page?.close();
        } catch {
        }
    }
}

export {screenshotStats};
