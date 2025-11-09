// utils/chromium-downloader.ts
import {install, canDownload, Browser, BrowserPlatform} from '@puppeteer/browsers';
import {existsSync, readdirSync} from 'fs';
import {join} from 'path';
import {t, Language} from '../i18n/translations';
import config from '../config';

function lang(): Language {
    return (config.language || 'en') as Language;
}

const BROWSER_DIR = join(process.cwd(), 'browser');
const BROWSER_TYPE = Browser.CHROMEHEADLESSSHELL; // Smallest version (~60-80 MB)
const PLATFORM = BrowserPlatform.WIN64;
// NOTE: Update this to the latest stable version periodically
// Check https://googlechromelabs.github.io/chrome-for-testing/ for versions
const BUILD_ID = '131.0.6778.108';

interface ChromiumInfo {
    executablePath: string;
}

/**
 * Finds already installed chrome-headless-shell in browser directory
 */
function findInstalledHeadlessShell(): string | null {
    const browserTypeDir = join(BROWSER_DIR, BROWSER_TYPE);

    if (!existsSync(browserTypeDir)) {
        return null;
    }

    try {
        const versions = readdirSync(browserTypeDir);
        if (versions.length === 0) {
            return null;
        }

        // Take the first (and should be only) version
        const versionDir = versions[0];
        const execPath = join(browserTypeDir, versionDir, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');

        if (existsSync(execPath)) {
            return execPath;
        }
    } catch {
        return null;
    }

    return null;
}

/**
 * Ensures Chromium Headless Shell is installed for screenshots
 * Downloads specified stable version on first run if not present
 */
export async function ensureChromiumInstalled(): Promise<ChromiumInfo | null> {
    try {
        // Check if chrome-headless-shell is already installed (any version)
        const installedPath = findInstalledHeadlessShell();

        if (installedPath) {
            console.log(`✅ ${t('chromium.found', lang())}`);
            return { executablePath: installedPath };
        }

        // Download stable chrome-headless-shell
        console.log(`📥 ${t('chromium.downloading', lang())}`);
        console.log(`   ${t('chromium.downloadSize', lang())}`);

        const result = await install({
            browser: BROWSER_TYPE,
            buildId: BUILD_ID,
            cacheDir: BROWSER_DIR,
            platform: PLATFORM
        });

        console.log(`✅ ${t('chromium.downloaded', lang())}`);

        return { executablePath: result.executablePath };
    } catch (error) {
        console.error(`❌ ${t('chromium.downloadError', lang())}`, error);
        return null;
    }
}
