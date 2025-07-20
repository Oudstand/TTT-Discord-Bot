import fs from 'fs';
import path from 'path';

const metaPath = path.join(process.cwd(), 'meta.json');

let meta = {};

// Lade die Datei beim Start
try {
    if (fs.existsSync(metaPath)) {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } else {
        save();
    }
} catch (error) {
    console.error('❌ Fehler beim Laden von meta.json:', error);
}

/**
 * Speichert die Daten in der JSON-Datei.
 */
function save() {
    try {
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    } catch (error) {
        console.error('❌ Fehler beim Speichern von meta.json:', error);
    }
}

/**
 * Ruft einen Wert aus dem Store ab.
 * @param {string} key Der Schlüssel des Werts.
 * @returns {any} Der gespeicherte Wert oder undefined.
 */
function get(key) {
    return meta[key];
}

/**
 * Setzt einen Wert im Store und speichert ihn.
 * @param {string} key Der Schlüssel des Werts.
 * @param {any} value Der zu speichernde Wert.
 */
function set(key, value) {
    meta[key] = value;
    save();
}

export { get, set };