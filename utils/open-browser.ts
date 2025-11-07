// utils/open-browser.ts
import config from "../config";
import {t, Language} from "../i18n/translations";

function lang(): Language {
    return (config.language || 'en') as Language;
}

function openBrowser(url: string): void {
    const platform = process.platform;
    try {
        if (platform === 'win32') {
            Bun.spawn(['cmd', '/c', 'start', '', url]);
        } else if (platform === 'darwin') {
            Bun.spawn(['open', url]);
        } else if (platform === 'linux') {
            Bun.spawn(['xdg-open', url]);
        }
    } catch (error) {
        console.error(`❌ ${t('utils.openBrowserError', lang())}`, error);
    }
}

export default openBrowser;