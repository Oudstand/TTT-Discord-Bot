[![GitHub](https://img.shields.io/badge/Repo-ttt--discord--bot-blue?logo=github)](https://github.com/Oudstand/TTT-Discord-Bot.git)

# TTT Discord Bot

![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)

🎮 A Discord bot for automatic mute/unmute control in Trouble in Terrorist Town (Garry's Mod), including web dashboard, player bindings, and statistics.

---

## ⚡ Features

- Automatic muting/unmuting of players in Discord voice channels based on in-game events
- Web dashboard for statistics overview, bindings management, and Discord voice channel monitoring
  - **Multi-language support:** Dashboard available in English and German (configurable via `.env`)
  - Bindings (SteamID ↔ DiscordID ↔ Name)
  - Statistics (total and per session):
    - Kills, Team Kills, Deaths, K/D Ratio
    - Wins, Losses, Winrate
    - Damage, Team Damage, Traitor Rounds
- Statistics are automatically posted to a Discord channel at the end of each round
- Persistent storage in SQLite database (via `bun:sqlite`)
- Screenshot generation using **Puppeteer** with bundled Chromium (fully standalone)
- Automated builds and releases via **GitHub Actions**

![TTT Dashboard Screenshot](dashboard.png)
*Names, avatars, SteamIDs, and DiscordIDs have been anonymized in this screenshot.*

---

## 🗃️ Database

This project uses `bun:sqlite`:

- Database file: `database.sqlite` (created automatically on first run)
- Tables:
  - bindings → SteamID, DiscordID, Name
  - stats → SteamID, Name, Kills, TeamKills, Deaths, Wins, Losses, TraitorRounds, Damage, TeamDamage
  - stats_session → SteamID, Name, Kills, TeamKills, Deaths, Wins, Losses, TraitorRounds, Damage, TeamDamage

---

## 📋 Requirements

- **Windows 10/11**
- **Garry's Mod** with **Trouble in Terrorist Town**
- **Discord Bot** (create one in the [Discord Developer Portal](https://discord.com/developers/applications))
- **Steam API Key** from [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)

---

## ⚙️ Setup & Installation

### 1. Discord Bot Setup

- Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications)
- Add the bot to your server:
  - Go to the `OAuth2` tab
  - Under `OAuth2 URL Generator`, select `bot` under `SCOPES`
  - Under `BOT PERMISSIONS`, select `Send Messages` and `Mute Members`
  - Use the generated link to invite the bot to your server

### 2. Configuration (.env file)

Create a `.env` file (or rename the downloaded `.env.example`) and fill in your values:

```env
STEAM_API_KEY=your-steam-api-key
DISCORD_TOKEN=your-bot-token
GUILD_ID=1234567890
COMMAND_CHANNEL_ID=1234567890
STATS_CHANNEL_ID=1234567890
LANGUAGE=en
```

**Configuration values:**
- `STEAM_API_KEY`: Your Steam API key
- `DISCORD_TOKEN`: Your bot's token from the Discord Developer Portal
- `GUILD_ID`: Your Discord server ID
- `COMMAND_CHANNEL_ID`: Channel ID for the unmute button
- `STATS_CHANNEL_ID`: Channel ID for statistics messages
- `LANGUAGE`: Language for bot and dashboard (`en` for English, `de` for German)

### 3. Local Network Setup for GMod

To allow Garry's Mod to communicate with the bot, a special loopback address must be configured.

1. **Add IP address:** Open Command Prompt as Administrator and run:
   ```bash
   netsh interface ipv4 add address "Loopback Pseudo-Interface 1" 192.178.0.1 255.255.255.255
   ```
2. **Edit hosts file:** Add the following line at the end of your hosts file (`C:\Windows\System32\drivers\etc\hosts`):
   ```
   192.178.0.1    ttthost
   ```

### 4. Install GMod Addon

Move the file `lua/autorun/server/discord_bot.lua` to your GMod server folder:
`<path-to-steam>\steamapps\common\GarrysMod\garrysmod\lua\autorun\server`

---

## 🔥 Running the Bot

### Using Pre-built Release (Recommended)

The easiest way to use the bot is to download the pre-built executable from GitHub Releases:

1. **Download:**
   - Go to [Releases](https://github.com/Oudstand/TTT-Discord-Bot/releases)
   - Download the latest `TTT Discord Bot.exe` and `.env.example`

2. **Setup:**
   - Rename `.env.example` to `.env`
   - Fill in your configuration (Discord token, Steam API key, etc.)
   - Place the `.env` file in the same folder as the `.exe`

3. **Run:**
   - Double-click `TTT Discord Bot.exe`
   - The dashboard will open automatically at http://localhost:3000

**Language Selection:**
The dashboard opens in the language specified in your `.env` file (`LANGUAGE`). You can also manually change the language by adding `?lang=en` or `?lang=de` to the URL.

**Note:** The `.exe` bundles Chromium internally for screenshot generation. The executable is fully standalone and portable - no additional browser installation required!

---

### Building from Source (Optional)

If you want to run the bot from source or build it yourself, follow these additional steps:

#### Requirements for Source Build

- **Bun:** Download and install Bun from the [official website](https://bun.sh/)

#### Download and Install

1. Clone the repository:
   ```bash
   git clone https://github.com/Oudstand/TTT-Discord-Bot.git
   cd TTT-Discord-Bot
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

#### Development Mode

Run the bot from source:

```bash
bun start
```

The dashboard will be available at http://localhost:3000.

#### Build Standalone .exe

To create your own portable `.exe` file:

```bash
bun run build
```

This creates `TTT Discord Bot.exe` in the project folder.

## ☕ Support this project

This project is developed and maintained in my free time.  
If you enjoy the mods or find them useful, you can support the development:

[![PayPal](https://img.shields.io/badge/PayPal-Buy%20me%20a%20coffee-blue.svg?style=for-the-badge)](https://paypal.me/oudstand)

Thank you for supporting open source! 💙
