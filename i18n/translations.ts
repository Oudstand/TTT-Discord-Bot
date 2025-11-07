// i18n/translations.ts - Central translation file

export type Language = 'de' | 'en';

interface Translations {
    [key: string]: string;
}

export const translations: Record<Language, Translations> = {
    de: {
        // Dashboard - Header
        'header.title': 'TTT Dashboard',
        'header.loading': 'Lade...',

        // Dashboard - Stats sections
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

        // Dashboard - Status
        'status.connected': 'Verbunden als',
        'status.disconnected': 'Keine Verbindung zum Bot',
        'ws.connected': 'WebSocket verbunden',

        // Dashboard - Voice section
        'voice.title': 'Spieler im Discord',
        'voice.mute': 'Muten',
        'voice.unmute': 'Entmuten',
        'voice.noPlayers': 'Noch ist niemand im Discord',
        'voice.loadError': 'Voice-Liste konnte nicht geladen werden',

        // Dashboard - Bindings section
        'bindings.title': 'Spieler ↔ Discord-Bindings',
        'bindings.name': 'Name',
        'bindings.steamId': 'SteamID64',
        'bindings.discordId': 'Discord-ID',
        'bindings.save': 'Speichern',
        'bindings.search': 'Suche...',
        'bindings.edit': 'Bearbeiten',
        'bindings.delete': 'Löschen',
        'bindings.loadError': 'Bindings konnten nicht geladen werden.',

        // Dashboard - Modal
        'modal.confirmDelete': 'Wirklich löschen?',
        'modal.confirmText': 'Soll der Eintrag wirklich gelöscht werden?',
        'modal.deleteButton': 'Löschen',
        'modal.cancelButton': 'Abbrechen',

        // Discord - Stats announcer
        'discord.stats.total': 'Gesamt-Statistik',
        'discord.stats.session': 'Session-Statistik',
        'discord.stats.messageDeleted': 'Nachricht wurde gelöscht. Erstelle neue.',

        // Discord - Unmute button
        'discord.button.unmute': 'Entmute dich selbst',
        'discord.button.unmuted': '🔊 Du wurdest entmutet.',
        'discord.button.unmuteError': '❌ Fehler beim Entmuten.',
        'discord.button.notInVoice': '❌ Du bist nicht in einem Voice-Channel.',
        'discord.button.guildNotFound': '❌ Fehler: Server nicht gefunden.',

        // Console logs
        'console.botReady': 'Bot ist bereit als',
        'console.dashboardRunning': 'Dashboard läuft auf',
        'console.muted': 'Gemutet',
        'console.unmuted': 'Entmutet',
        'console.unmuteAllStart': 'Versuche, alle Spieler zu entmuten...',
        'console.unmuteAllSuccess': 'Alle Spieler erfolgreich entmutet.',
        'console.unmuteAllErrors': 'Entmutung abgeschlossen mit {count} Fehlern.',
        'console.roundEnd': 'Rundenende empfangen, aktualisiere Statistiken...',
    },
    en: {
        // Dashboard - Header
        'header.title': 'TTT Dashboard',
        'header.loading': 'Loading...',

        // Dashboard - Stats sections
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

        // Dashboard - Status
        'status.connected': 'Connected as',
        'status.disconnected': 'No connection to bot',
        'ws.connected': 'WebSocket connected',

        // Dashboard - Voice section
        'voice.title': 'Players in Discord',
        'voice.mute': 'Mute',
        'voice.unmute': 'Unmute',
        'voice.noPlayers': 'No players in voice channel yet',
        'voice.loadError': 'Failed to load voice list',

        // Dashboard - Bindings section
        'bindings.title': 'Player ↔ Discord Bindings',
        'bindings.name': 'Name',
        'bindings.steamId': 'SteamID64',
        'bindings.discordId': 'Discord ID',
        'bindings.save': 'Save',
        'bindings.search': 'Search...',
        'bindings.edit': 'Edit',
        'bindings.delete': 'Delete',
        'bindings.loadError': 'Failed to load bindings.',

        // Dashboard - Modal
        'modal.confirmDelete': 'Really delete?',
        'modal.confirmText': 'Do you really want to delete this entry?',
        'modal.deleteButton': 'Delete',
        'modal.cancelButton': 'Cancel',

        // Discord - Stats announcer
        'discord.stats.total': 'Total Statistics',
        'discord.stats.session': 'Session Statistics',
        'discord.stats.messageDeleted': 'message was deleted. Creating new one.',

        // Discord - Unmute button
        'discord.button.unmute': 'Unmute yourself',
        'discord.button.unmuted': '🔊 You have been unmuted.',
        'discord.button.unmuteError': '❌ Error unmuting.',
        'discord.button.notInVoice': '❌ You are not in a voice channel.',
        'discord.button.guildNotFound': '❌ Error: Guild not found.',

        // Console logs
        'console.botReady': 'Bot is ready as',
        'console.dashboardRunning': 'Dashboard running on',
        'console.muted': 'Muted',
        'console.unmuted': 'Unmuted',
        'console.unmuteAllStart': 'Attempting to unmute all players...',
        'console.unmuteAllSuccess': 'All players successfully unmuted.',
        'console.unmuteAllErrors': 'Unmute completed with {count} errors.',
        'console.roundEnd': 'Round end received, updating statistics...',
    }
};

// Helper function to get translation
export function t(key: string, lang: Language = 'en'): string {
    return translations[lang][key] || key;
}
