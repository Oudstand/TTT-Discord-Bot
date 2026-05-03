// utils/open-browser.ts
import config from "../config";
import { t, Language } from "../i18n/translations";
import { exec } from "child_process";

function lang(): Language {
    return (config.language || 'en') as Language;
}

function openBrowser(url: string): void {
    const platform = process.platform;
    try {
        if (platform === 'win32') {
            // Windows' 'start' command parses the first quoted string as a window title if provided. 
            // We use windowsHide to prevent a console pop-up when starting from a GUI-only bun exe.
            exec(`start "" "${url}"`, { windowsHide: true });
        } else if (platform === 'darwin') {
            exec(`open "${url}"`, { windowsHide: true });
        } else if (platform === 'linux') {
            exec(`xdg-open "${url}"`, { windowsHide: true });
        }
    } catch (error) {
        console.error(`❌ ${t('utils.openBrowserError', lang())}`, error);
    }
}

export default openBrowser;