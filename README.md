# tttt-discord-bot

Discord Bot verwalten: https://discord.com/developers/applications/1392039858960339085/

Install the dependencies and configure environment variables:

```bash
npm install
cp .env.example .env
# then edit .env and add your values
```

The bot now stores data in a `database.sqlite` file using
[better-sqlite3](https://github.com/WiseLibs/better-sqlite3). The database will
be created automatically on first run. Steam and Discord IDs are stored
uniquely so each account can only be bound once.

Run the bot with `node app.js`.

