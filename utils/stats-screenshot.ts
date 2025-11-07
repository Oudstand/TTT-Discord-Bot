// utils/stats-screenshot.ts
import puppeteer, {Browser, Page} from "puppeteer-core";
import {getEdgePath} from "edge-paths";
import {ScreenshotPath, StatsType} from "../types";
import config from "../config";
import {t, Language} from "../i18n/translations";

function lang(): Language {
    return (config.language || 'en') as Language;
}

let edgeInitialized = false;

async function launchBrowserWithRetry(edgePath: string, maxRetries: number = 2): Promise<Browser | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const browser = await puppeteer.launch({
                executablePath: edgePath,
                headless: true,
                timeout: 30000 // Shorter timeout
            });
            edgeInitialized = true; // Mark as successful
            return browser;
        } catch (error: any) {
            console.error(`❌ ${t('screenshot.launchAttempt', lang(), {attempt: attempt.toString(), maxRetries: maxRetries.toString()})}`, error.message);

            if (attempt < maxRetries) {
                console.log(`   ${t('screenshot.retrying', lang())}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    return null;
}

async function screenshotStats(type: StatsType = 'all', filename: ScreenshotPath = 'stats_all.png'): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        const edgePath = getEdgePath();

        if (!edgePath) {
            console.error(`❌ ${t('screenshot.edgeNotFound', lang())}`);
            return;
        }

        browser = await launchBrowserWithRetry(edgePath);

        if (!browser) {
            if (!edgeInitialized) {
                console.log(`ℹ️  ${t('screenshot.edgeInitRequired', lang())}`);
                console.log(`   ${t('screenshot.restartBot', lang())}`);
            } else {
                console.error(`❌ ${t('screenshot.launchFailed', lang())}`);
            }
            return;
        }

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
            console.error(`❌ ${t('screenshot.tableNotFound', lang())}`);
            await page.screenshot({path: filename, fullPage: true});
        }
    } catch (error) {
        console.error(`❌ ${t('screenshot.errorCreating', lang())}`, error);
    } finally {
        try { await page?.close(); } catch {}
        try { await browser?.close(); } catch {}
    }
}

export {screenshotStats};