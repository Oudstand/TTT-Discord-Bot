// config.js
require('dotenv').config();
module.exports = {
    token: process.env.DISCORD_TOKEN,
    guildId: process.env.GUILD_ID,
    commandChannelId: process.env.COMMAND_CHANNEL_ID,
    statsChannelId: process.env.STATS_CHANNEL_ID
};
