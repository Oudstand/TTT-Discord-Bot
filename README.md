[![GitHub](https://img.shields.io/badge/Repo-ttt--discord--bot-blue?logo=github)](https://github.com/Oudstand/TTT-Discord-Bot.git)

# TTT Discord Bot

![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)

🎮 Ein Discord-Bot zur automatischen Mute-/Unmute-Steuerung für Trouble in Terrorist Town (Garry's Mod), inkl. Web-Dashboard, Spielerbindungen und Statistiken.

---

## ⚡ Features

- Automatisches Muten/Entmuten der Spieler im Discord-Voice-Channel, basierend auf Spielereignissen.
- Web-Dashboard für den Einblick in Statistiken, Verwaltung der Bindings, Übersicht wer im Discord ist
  - Bindings (SteamID ↔ DiscordID ↔ Name).
  - Statistiken (insgesamt und pro Session):
    - Kills
    - Team-Kills
    - Tode
    - K/D
    - Siege
    - Niederlagen
    - Schaden
    - Teamschaden
    - Traitor-Runden
    - Winrate
- Die Statistiken (Gesamtstatistiken und von der aktuellen Session) werden zusätzlich am Ende einer Runde im Discord Kanal mit der ID `STATS_CHANNEL_ID` gepostet.
- Persistente Speicherung in SQLite-Datenbank (via `better-sqlite3`).

![TTT Dashboard Screenshot](dashboard.png)
Die Namen, Avatare, SteamIDs und DiscordIDs wurden im Screenshot anonymisiert. Im Betrieb werden die Profilbilder aus Discord (falls vorhanden) angezeigt.

---

## 🗃️ Datenbank

Dieses Projekt nutzt `better-sqlite3`:

- Datenbank-Datei: `database.sqlite` (wird beim Start automatisch erstellt)
- Tabellen:
  - bindings → SteamID, DiscordID, Name
  - stats → SteamID, Name, Kills, TeamKills, Deaths, Wins, Losses, TraitorRounds, Damage, TeamDamage
  - stats_session → SteamID, Name, Kills, TeamKills, Deaths, Wins, Losses, TraitorRounds, Damage, TeamDamage

---

## 🤖 Discord Bot

- Erstellen und verwalten unter: https://discord.com/developers/applications
- Zum Server hinzufügen:
  - Auf den Reiter `OAuth2` wechseln.
  - Dort unter `OAuth2 URL Generator` unter `SCOPES` `bot` auswählen.
  - Anschließend unter `BOT PERMISSIONS` `Send Messages` und `Mute Members` auswählen.
  - Mit dem unten stehenden Link den Bot zum Server hinzufügen.
- Anlegen der ``.env`` Datei:
   ```bash
   cp .env.example .env
  ```
- Einfügen der Werte in die `.env` Datei:
  - `DISCORD_TOKEN`: Token des Bots
  - `GUILD_ID`: ID des Servers
  - `COMMAND_CHANNEL_ID`: ID des Kanals für Befehle
  - `STATS_CHANNEL_ID`: ID des Kanals für Statistiken

## 🔥 Starten

- Verschiebe die Datei `discord_bot.lua` nach: `<pfad-zu-steam>\steamapps\common\GarrysMod\garrysmod\lua\autorun\server`.
- Platziere die erzeugte `.env` Datei neben der `TTT Discord Bot.exe` und führe diese aus.


---

---

# ⚙️ Manuelles Setup aus dem Code

## 📦 Voraussetzungen

Bevor du `npm install` ausführst, stelle sicher, dass dein System vorbereitet ist.

### 1️⃣ Node.js installieren

- Empfohlen: [Node.js LTS (20.x)](https://nodejs.org/)
- Prüfen:
  ```bash
  node --version
  npm --version
  ```

### 2️⃣ Python installieren

`better-sqlite3` benötigt Python ≥ 3.6 zur Installation.

- Download: https://www.python.org/downloads/windows/
- WICHTIG: Bei der Installation „Add to PATH“ anhaken.
- Prüfen:
  ```bash
  python --version
  ```

- Falls du mehrere Python-Versionen hast oder npm es nicht findet:
  ```bash
  npm config set python "C:\\Path\\To\\python.exe"
  ```

### 3️⃣ Microsoft C++ Build Tools installieren

- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Bei der Installation auswählen:
    - ✅ „C++ build tools“
    - ✅ „Windows 10 SDK“ (oder neuer)

Prüfen:

```bash
where cl
```

### 4️⃣ Loopback-Adresse & Hostname für TTT-Integration anlegen (nur Windows)

Für die lokale Kommunikation zwischen Garry’s Mod (TTT) und dem Bot muss eine spezielle Loopback-Adresse und ein Hostname eingerichtet werden.

- Füge eine zusätzliche IP zum Loopback-Interface hinzu:
  Öffne eine Eingabeaufforderung als Administrator und führe aus:
  ```bash 
  netsh interface ipv4 add address "Loopback Pseudo-Interface 1" 192.178.0.1 255.255.255.255
  ```
- Ergänze deine Hosts-Datei (C:\Windows\System32\drivers\etc\hosts) um:
  ```bash
  192.178.0.1    ttthost
  ```

---

## ⚙️ Initiales Setup

- Code auschecken und installieren:
```bash
git clone https://github.com/Oudstand/TTT-Discord-Bot.git
cd ttt-discord-bot

npm install
```

- Verschiebe die Datei `discord_bot.lua` nach: `<pfad-zu-steam>\steamapps\common\GarrysMod\garrysmod\lua\autorun\server`.
---

## 🔥 Starten

Zum Starten folgendes ausführen.
  ```bash
  node .\app.js
  ```

Das Dashboard läuft dann auf: http://localhost:3000

Alternativ erzeugen einer `.exe` mit `pkg`
```bash
npm install -g pkg
npm run build
```