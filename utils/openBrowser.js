// utils/open-browser.js

function openBrowser(url) {
    const platform = process.platform;
    if (platform === 'win32') {
        Bun.spawn(['cmd', '/c', 'start', '', url]);
    } else if (platform === 'darwin') {
        Bun.spawn(['open', url]);
    } else if (platform === 'linux') {
        Bun.spawn(['xdg-open', url]);
    }
}

export default openBrowser;