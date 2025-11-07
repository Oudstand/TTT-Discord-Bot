// public/ts/i18n.ts - Internationalization system

type Language = 'de' | 'en';

interface Translations {
    [key: string]: string;
}

const translations: Record<Language, Translations> = {
    de: {
        // Header
        'header.title': 'TTT Dashboard',
        'header.loading': 'Lade...',

        // Stats sections
        'stats.session': 'Session-Statistik',
        'stats.total': 'Gesamt-Statistik',
        'stats.rank': 'Rang',
        'stats.player': 'Spieler',
        'stats.kills': 'Kills',
        'stats.teamKills': 'Team-Kills',
        'stats.deaths': 'Tode',
        'stats.kd': 'K/D',
        'stats.wins': 'Siege',
        'stats.losses': 'Losses',
        'stats.damage': 'Schaden',
        'stats.teamDamage': 'Teamschaden',
        'stats.traitor': 'Traitor',
        'stats.winrate': 'Winrate',
        'stats.noData': 'Noch keine Statistiken vorhanden.',
        'stats.unknownPlayer': 'Unbekannter Spieler',
        'stats.loadError': 'Fehler beim Laden der Statistiken',

        // Status
        'status.connected': 'Verbunden als',
        'status.disconnected': 'Keine Verbindung zum Bot',
        'ws.connected': 'WebSocket verbunden',

        // Voice section
        'voice.title': 'Spieler im Discord',
        'voice.mute': 'Muten',
        'voice.unmute': 'Entmuten',
        'voice.noPlayers': 'Noch ist niemand im Discord',
        'voice.loadError': 'Voice-Liste konnte nicht geladen werden',

        // Bindings section
        'bindings.title': 'Spieler ↔ Discord-Bindings',
        'bindings.name': 'Name',
        'bindings.steamId': 'SteamID64',
        'bindings.discordId': 'Discord-ID',
        'bindings.save': 'Speichern',
        'bindings.search': 'Suche...',
        'bindings.edit': 'Bearbeiten',
        'bindings.delete': 'Löschen',
        'bindings.loadError': 'Bindings konnten nicht geladen werden.',

        // Modal
        'modal.confirmDelete': 'Wirklich löschen?',
        'modal.confirmText': 'Soll der Eintrag wirklich gelöscht werden?',
        'modal.deleteButton': 'Löschen',
        'modal.cancelButton': 'Abbrechen',

        // Language switcher
        'lang.switch': 'Switch to English',
    },
    en: {
        // Header
        'header.title': 'TTT Dashboard',
        'header.loading': 'Loading...',

        // Stats sections
        'stats.session': 'Session Statistics',
        'stats.total': 'Total Statistics',
        'stats.rank': 'Rank',
        'stats.player': 'Player',
        'stats.kills': 'Kills',
        'stats.teamKills': 'Team Kills',
        'stats.deaths': 'Deaths',
        'stats.kd': 'K/D',
        'stats.wins': 'Wins',
        'stats.losses': 'Losses',
        'stats.damage': 'Damage',
        'stats.teamDamage': 'Team Damage',
        'stats.traitor': 'Traitor',
        'stats.winrate': 'Winrate',
        'stats.noData': 'No statistics available yet.',
        'stats.unknownPlayer': 'Unknown Player',
        'stats.loadError': 'Error loading statistics',

        // Status
        'status.connected': 'Connected as',
        'status.disconnected': 'No connection to bot',
        'ws.connected': 'WebSocket connected',

        // Voice section
        'voice.title': 'Players in Discord',
        'voice.mute': 'Mute',
        'voice.unmute': 'Unmute',
        'voice.noPlayers': 'No players in voice channel yet',
        'voice.loadError': 'Failed to load voice list',

        // Bindings section
        'bindings.title': 'Player ↔ Discord Bindings',
        'bindings.name': 'Name',
        'bindings.steamId': 'SteamID64',
        'bindings.discordId': 'Discord ID',
        'bindings.save': 'Save',
        'bindings.search': 'Search...',
        'bindings.edit': 'Edit',
        'bindings.delete': 'Delete',
        'bindings.loadError': 'Failed to load bindings.',

        // Modal
        'modal.confirmDelete': 'Really delete?',
        'modal.confirmText': 'Do you really want to delete this entry?',
        'modal.deleteButton': 'Delete',
        'modal.cancelButton': 'Cancel',

        // Language switcher
        'lang.switch': 'Auf Deutsch wechseln',
    }
};

class I18n {
    private currentLanguage: Language;

    constructor() {
        this.currentLanguage = this.detectLanguage();
    }

    private detectLanguage(): Language {
        // 1. Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang === 'de' || urlLang === 'en') {
            return urlLang;
        }

        // 2. Check localStorage
        const storedLang = localStorage.getItem('language');
        if (storedLang === 'de' || storedLang === 'en') {
            return storedLang;
        }

        // 3. Default to English
        return 'en';
    }

    public setLanguage(lang: Language): void {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        this.updateDOM();

        // Update URL without reload
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url.toString());
    }

    public getLanguage(): Language {
        return this.currentLanguage;
    }

    public t(key: string): string {
        return translations[this.currentLanguage][key] || key;
    }

    public updateDOM(): void {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                element.textContent = this.t(key);
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (key && element instanceof HTMLInputElement) {
                element.placeholder = this.t(key);
            }
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (key) {
                element.setAttribute('title', this.t(key));
            }
        });
    }

    public toggleLanguage(): void {
        const newLang: Language = this.currentLanguage === 'de' ? 'en' : 'de';
        this.setLanguage(newLang);

        // Trigger custom event so dashboard can reload content
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLang } }));
    }
}

// Create global instance
const i18n = new I18n();

export default i18n;
export type { Language };
