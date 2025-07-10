print("[TTTDiscordBot] Server-side script loaded")

local apiBase = "http://ttthost:3000/api"
local deadPlayers = {}

hook.Add("PlayerDeath", "TTTDiscordDeath", function(victim, inflictor, attacker)
    if IsValid(victim) and victim:IsPlayer() then
        http.Post(apiBase .. "/mute", {
            steamId = victim:SteamID64()
        })
        http.Post(apiBase .. "/trackDeath", {
                    steamId = victim:SteamID64()
                })
        deadPlayers[victim:SteamID64()] = true

        if IsValid(attacker) and attacker:IsPlayer() then
            http.Post(apiBase .. "/trackKill", {
                killer = attacker:SteamID64(),
                victim = victim:SteamID64()
            })
        end
    end
end)

hook.Add("PlayerSpawn", "TTTDiscordSpawn", function(ply)
    if IsValid(ply) and ply:IsPlayer() and deadPlayers[ply:SteamID64()] then
        http.Post(apiBase .. "/unmute", {
            steamId = ply:SteamID64()
        })
        deadPlayers[victim:SteamID64()] = nil
    end
end)

hook.Add("TTTEndRound", "TTTDiscordRoundEnd", function(result)
    print("TTTDiscordRoundEnd")
    for _, ply in ipairs(player.GetAll()) do
        local sid = ply:SteamID64()
        local role = ply:GetRole()

        if not role then continue end

        local won = false

        -- result: 1 = Traitor-Win, 2 = Innocent-Win
        if result == WIN_TRAITOR and (role == ROLE_TRAITOR) then won = true end
        if result == WIN_INNOCENT and (role == ROLE_INNOCENT or role == ROLE_DETECTIVE) then won = true end

        http.Post(apiBase .. "/trackWin", {
          steamId = sid,
          win = won and "1" or "0"
        })
      end

    http.Post(apiBase .. "/unmuteAll", {})
    deadPlayers = {}
end)