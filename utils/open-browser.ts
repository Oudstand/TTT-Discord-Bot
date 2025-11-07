// utils/open-browser.ts

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
        console.error('❌ Error opening browser:', error);
    }
}

export default openBrowser;