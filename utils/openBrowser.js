// utils/open-browser.js
const { spawn } = require('child_process');

function openBrowser(url) {
    const platform = process.platform;
    if (platform === 'win32') {
        spawn('cmd', ['/c', 'start', '', url]);
    } else if (platform === 'darwin') {
        spawn('open', [url]);
    } else if (platform === 'linux') {
        spawn('xdg-open', [url]);
    }
}

module.exports = openBrowser;