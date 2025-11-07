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
- Screenshot generation using **Playwright** with Microsoft Edge (pre-installed on Windows 10/11)
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

## ⚙️ Setup & Installation

### 1. Requirements

- **Bun:** Download and install Bun from the [official website](https://bun.sh/)
- **Garry's Mod** with **Trouble in Terrorist Town**
- **Steam API Key** from [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)

### 2. Download Project

Download the code or clone the repository:
```bash
git clone https://github.com/Oudstand/TTT-Discord-Bot.git
cd TTT-Discord-Bot
```

### 3. Discord Bot Setup

- Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications)
- Add the bot to your server:
  - Go to the `OAuth2` tab
  - Under `OAuth2 URL Generator`, select `bot` under `SCOPES`
  - Under `BOT PERMISSIONS`, select `Send Messages` and `Mute Members`
  - Use the generated link to invite the bot to your server
- Copy `.env.example` to `.env` and fill in the values:
  - `STEAM_API_KEY`: Your Steam API key
  - `DISCORD_TOKEN`: Your bot's token
  - `GUILD_ID`: Your Discord server ID
  - `COMMAND_CHANNEL_ID`: Channel ID for the unmute button
  - `STATS_CHANNEL_ID`: Channel ID for statistics messages
  - `DASHBOARD_LANGUAGE`: Dashboard language (`en` for English, `de` for German, default: `en`)

### 4. Local Network Setup for GMod (Windows only)

To allow Garry's Mod to communicate with the bot, a special loopback address must be configured.

1. **Add IP address:** Open Command Prompt as Administrator and run:
  ```bash
  netsh interface ipv4 add address "Loopback Pseudo-Interface 1" 192.178.0.1 255.255.255.255
  ```
2. **Edit hosts file:** Add the following line at the end of your hosts file (`C:\Windows\System32\drivers\etc\hosts`):
  ```bash
  192.178.0.1    ttthost
  ```

### 5. Install GMod Addon

Move the file `lua/autorun/server/discord_bot.lua` to your GMod server folder: `<path-to-steam>\steamapps\common\GarrysMod\garrysmod\lua\autorun\server`.

### 6. Install Dependencies

Run the following command in the project folder:
  ```bash
  bun install
  ```

---

## 🔥 Running the Bot

### Start Bot

Run in the project folder:

```bash
bun start
```

The dashboard will then be available at http://localhost:3000.

**Language Selection:**
The dashboard opens in the language specified in your `.env` file (`DASHBOARD_LANGUAGE`). You can also manually change the language by adding `?lang=en` or `?lang=de` to the URL.


### Build Standalone .exe

You can create a single, portable `.exe` file:
1. **Build:**
  ```bash
  bun run build
  ```
2. **Run:**
- Take the created `TTT Discord Bot.exe`
- Place your `.env` file in the same folder
- Start the `.exe`

**Note:** The `.exe` uses Microsoft Edge (pre-installed on Windows 10/11) for screenshot generation. No additional browser installation required!
