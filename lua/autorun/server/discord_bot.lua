if not SERVER then return end

print("[TTTDiscordBot] Server-side script loaded")

local ApiBase = "http://ttthost:3000/api"
local TEAM_TRAITOR = "traitor"
local TEAM_INNOCENT = "innocent"
local TEAM_UNKNOWN = "unknown"
local DeadPlayers = {}

local plyMeta = FindMetaTable("Player")
if not plyMeta then
    return
end

function plyMeta:GetTeam()
    local role = self:GetRole()
    if role == ROLE_TRAITOR then
        return TEAM_TRAITOR
    end
    if role == ROLE_INNOCENT or role == ROLE_DETECTIVE then
        return TEAM_INNOCENT
    end
    return TEAM_UNKNOWN
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

    if victim:GetTeam() ~= attacker:GetTeam() then
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
    if not IsValidPlayer(attacker) then
        return
    end

    local dmg = dmginfo:GetDamage() * attacker:GetDamageFactor()
    if dmg <= 0 then
        return
    end

    if target:GetTeam() ~= attacker:GetTeam() then
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
        if IsValidPlayer(ply) and ply:GetRole() then
            local sid = ply:SteamID64()
            local team = ply:GetTeam()
            local won = false

            if result == WIN_TRAITOR and team == TEAM_TRAITOR then
                won = true
            end
            if result == WIN_INNOCENT and team == TEAM_INNOCENT then
                won = true
            end

            http.Post(ApiBase .. "/trackWin", {
                steamId = sid,
                win = won and "1" or "0"
            })

            if team == TEAM_TRAITOR then
                http.Post(ApiBase .. "/trackTraitorRound", { steamId = sid })
            end
        end
    end

    http.Post(ApiBase .. "/unmuteAll", {})
    http.Post(ApiBase .. "/updateStats", {})
    DeadPlayers = {}
end)
