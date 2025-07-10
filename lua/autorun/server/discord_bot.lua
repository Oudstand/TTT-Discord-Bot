print("[TTTDiscordAutoMute] Server-side script loaded")

local apiBase = "http://ttthost:3000/api"
local deadPlayers = {}
local playerRoles = {}

hook.Add("PlayerDeath", "TTTDiscordDeath", function(victim, inflictor, attacker)
    if IsValid(victim) and victim:IsPlayer() then
        http.Post(apiBase .. "/mute", {
            steamid = victim:SteamID64()
        })
        deadPlayers[victim:SteamID64()] = true
    end
end)

hook.Add("TTTScoreKill", "TrackKill", function(killer, victim)
    if IsValid(killer) and killer:IsPlayer() and IsValid(victim) and victim:IsPlayer() then
        print(killer:Nick() .. " hat " .. victim:Nick() .. " getötet (TTTScoreKill)")
        http.Post(apiBase .. "/trackKill", {
            killer = attacker:SteamID64(),
            victim = victim:SteamID64()
        })
    end
end)


hook.Add("PlayerSpawn", "TTTDiscordSpawn", function(ply)
    if IsValid(ply) and ply:IsPlayer() and deadPlayers[ply:SteamID64()] then
        http.Post(apiBase .. "/unmute", {
            steamid = ply:SteamID64()
        })
        deadPlayers[victim:SteamID64()] = nil
    end
end)

hook.Add("TTTBeginRound", "CaptureRoles", function()
    playerRoles = {}
    for _, ply in ipairs(player.GetAll()) do
      if ply:IsPlayer() then
        playerRoles[ply:SteamID64()] = ply:GetRole()
      end
    end
  end)

hook.Add("TTTEndRound", "TTTDiscordRoundEnd", function()
    http.Post(apiBase .. "/unmuteAll", {})
    deadPlayers = {}

    for _, ply in ipairs(player.GetAll()) do
        local sid = ply:SteamID64()
        local role = playerRoles[sid]

        if not role then continue end

        local won = false

        -- result: 1 = Traitor-Win, 2 = Innocent-Win
        if result == WIN_TRAITOR and (role == ROLE_TRAITOR) then won = true end
        if result == WIN_INNOCENT and (role == ROLE_INNOCENT or role == ROLE_DETECTIVE) then won = true end

        http.Post(apiBase .. "/trackWin", {
          steamid = sid,
          win = won and "1" or "0"
        })
      end
end)