# TTT Discord Bot

![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)

🎮 Ein Discord-Bot zur automatischen Mute-/Unmute-Steuerung für Trouble in Terrorist Town (Garry's Mod), inkl. Web-Dashboard, Spielerbindungen und Statistiken.

---

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

better-sqlite3 benötigt Python ≥ 3.6 zur Installation.

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

```bash
git clone https://github.com/DEIN_REPO/ttt-discord-bot.git
cd ttt-discord-bot

npm install
```

---

## 🔥 Starten

  ```bash
  node .\app.js
  ```

Das Dashboard läuft dann auf: http://localhost:3000

---

## ⚡ Features

- Automatisches Muten/Entmuten der Spieler im Discord-Voice-Channel, basierend auf Spielereignissen.
- Bindings (SteamID ↔ DiscordID ↔ Name).
- Kill-/Death-/Win-/Loss-Statistiken.
- Web-Dashboard mit Live-Übersicht und Steuerung.
- Persistente Speicherung in SQLite-Datenbank (via better-sqlite3).

---

## 🗃️ Datenbank

Dieses Projekt nutzt better-sqlite3:

- Datenbank-Datei: ttt.db (wird beim Start automatisch erstellt)
- Tabellen:
    - bindings → SteamID, DiscordID, Name
    - stats → SteamID, Name, Kills, Deaths, Wins, Losses

---

## 🤖 Discord Bot

- Erstellen und verwalten unter: https://discord.com/developers/applications
- Zum Server hinzufügen
- Anlegen der ``.env`` Datei:
   ```bash
   cp .env.example .env
  ```
- Einfügen der Werte in die `.env` Datei:
    - `DISCORD_TOKEN`: Token des Bots
    - `GUILD_ID`: ID des Servers
    - `COMMAND_CHANNEL_ID`: ID des Kanals für Befehle
    - `STATS_CHANNEL_ID`: ID des Kanals für Statistiken