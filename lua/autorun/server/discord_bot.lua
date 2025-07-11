print("[TTTDiscordBot] Server-side script loaded")

local ApiBase = "http://ttthost:3000/api"
local DeadPlayers = {}

local function GetTeam(role)
    if role == ROLE_TRAITOR then
        return "traitor"
    end
    if role == ROLE_INNOCENT or role == ROLE_DETECTIVE then
        return "innocent"
    end
    return tostring(role)
end

local function IsValidPlayer(player)
    return IsValid(player) and player:IsPlayer() and not player:IsBot()
end

local function IsActiveRound()
    return GetRoundState() == ROUND_ACTIVE
end

hook.Add("PlayerDeath", "TTTDiscordDeath", function(victim, inflictor, attacker)
    if not IsActiveRound() or not IsValidPlayer(victim) then
        return
    end

    http.Post(ApiBase .. "/mute", { steamId = victim:SteamID64() })
    http.Post(ApiBase .. "/trackDeath", { steamId = victim:SteamID64() })
    DeadPlayers[victim:SteamID64()] = true

    if not IsValidPlayer(attacker) or victim == attacker then
        return
    end

    if GetTeam(victim:GetRole()) ~= GetTeam(attacker:GetRole()) then
        http.Post(ApiBase .. "/trackKill", { steamId = attacker:SteamID64() })
    else
        http.Post(ApiBase .. "/trackTeamKill", { steamId = attacker:SteamID64() })
    end
end)

hook.Add("PlayerSpawn", "TTTDiscordSpawn", function(ply)
    if not IsValidPlayer(ply) or not DeadPlayers[ply:SteamID64()] then
        return
    end

    http.Post(ApiBase .. "/unmute", { steamId = ply:SteamID64() })
    DeadPlayers[ply:SteamID64()] = nil
end)

hook.Add("EntityTakeDamage", "TTTTrackDamage", function(target, dmginfo)
    if not IsActiveRound() or not IsValidPlayer(target) then
        return
    end

    local attacker = dmginfo:GetAttacker()
    local dmg = dmginfo:GetDamage() * attacker:GetDamageFactor()

    if dmg <= 0 or not IsValidPlayer(attacker) then
        return
    end

    if GetTeam(target:GetRole()) ~= GetTeam(attacker:GetRole()) then
        http.Post(ApiBase .. "/trackDamage", {
            steamId = attacker:SteamID64(),
            damage = tostring(dmg)
        })
    else
        http.Post(ApiBase .. "/trackTeamDamage", {
            steamId = attacker:SteamID64(),
            damage = tostring(dmg)
        })
    end
end)

hook.Add("TTTEndRound", "TTTDiscordRoundEnd", function(result)
    print("TTTRoundEnd")
    for _, ply in ipairs(player.GetAll()) do
        local sid = ply:SteamID64()
        local role = ply:GetRole()

        if not IsValidPlayer(ply) or not role then
            continue
        end

        local won = false

        if result == WIN_TRAITOR and (role == ROLE_TRAITOR) then
            won = true
        end
        if result == WIN_INNOCENT and (role == ROLE_INNOCENT or role == ROLE_DETECTIVE) then
            won = true
        end

        http.Post(ApiBase .. "/trackWin", {
            steamId = sid,
            win = won and "1" or "0"
        })

        if role == ROLE_TRAITOR then
            http.Post(ApiBase .. "/trackTraitorRound", { steamId = sid })
        end
    end

    http.Post(ApiBase .. "/unmuteAll", {})
    http.Post(ApiBase .. "/updateStats", {})
    DeadPlayers = {}
end)
