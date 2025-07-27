if not SERVER then
    return
end

print("[TTTDiscordBot] Server-side script loaded")

local ApiBase = "http://ttthost:3000/api"
local TEAM_TRAITOR = "traitor"
local TEAM_INNOCENT = "innocent"
local TEAM_UNKNOWN = "unknown"

local DeadPlayers = {}
local RoundStats = {}

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

local function IsLastAliveInTeam(victim)
    local team = victim:GetTeam()
    if team == TEAM_UNKNOWN then
        return false
    end

    for _, ply in player.Iterator() do
        if IsValidPlayer(ply) and ply ~= victim and ply:IsTerror() and ply:Alive() and ply:GetTeam() == team then
            return false
        end
    end
    return true
end

local function GetPlayerStats(ply)
    local sid = ply:SteamID64()
    if not RoundStats[sid] then
        RoundStats[sid] = {
            damage = 0,
            teamDamage = 0,
            kills = 0,
            teamKills = 0,
            deaths = 0
        }
    end
    return RoundStats[sid]
end

hook.Add("TTTBeginRound", "TTTDiscordRoundStart", function()
    http.Post(ApiBase .. "/roundStart")
end)

hook.Add("PlayerDeath", "TTTDiscordDeath", function(victim, inflictor, attacker)
    if not IsActiveRound() or not IsValidPlayer(victim) then
        return
    end

    local victimStats = GetPlayerStats(victim)
    victimStats.deaths = victimStats.deaths + 1

    if IsValidPlayer(attacker) and victim ~= attacker then
        local attackerStats = GetPlayerStats(attacker)
        if victim:GetTeam() ~= attacker:GetTeam() then
            attackerStats.kills = attackerStats.kills + 1
        else
            attackerStats.teamKills = attackerStats.teamKills + 1
        end
    end

    timer.Simple(0, function()
        if not IsActiveRound() or not IsValidPlayer(victim) then
            return
        end
        if not victim:Alive() and not IsLastAliveInTeam(victim) then
            -- check to avoid race conditions in TTTEndRound
            http.Post(ApiBase .. "/dead", { steamId = victim:SteamID64() })
            DeadPlayers[victim:SteamID64()] = true
        end
    end)
end)

hook.Add("PlayerSpawn", "TTTDiscordSpawn", function(ply)
    if not IsValidPlayer(ply) or not DeadPlayers[ply:SteamID64()] then
        return
    end

    http.Post(ApiBase .. "/spawn", { steamId = ply:SteamID64() })
    DeadPlayers[ply:SteamID64()] = nil
end)

hook.Add("EntityTakeDamage", "TTTTrackDamage", function(target, dmginfo)
    if not IsActiveRound() or not IsValidPlayer(target) then
        return
    end

    local attacker = dmginfo:GetAttacker()
    if not IsValidPlayer(attacker) or attacker == target then
        return
    end

    local dmg = dmginfo:GetDamage() * attacker:GetDamageFactor()
    if dmg <= 0 then
        return
    end

    local attackerStats = GetPlayerStats(attacker)
    if target:GetTeam() ~= attacker:GetTeam() then
        attackerStats.damage = attackerStats.damage + dmg
    else
        attackerStats.teamDamage = attackerStats.teamDamage + dmg
    end
end)

hook.Add("TTTEndRound", "TTTDiscordRoundEnd", function(result)
    local finalPayload = {}

    for _, ply in player.Iterator() do
        if IsValidPlayer(ply) and ply:GetRole() then
            local sid = ply:SteamID64()
            local team = ply:GetTeam()
            local won = (result == WIN_TRAITOR and team == TEAM_TRAITOR) or ((result == WIN_INNOCENT or result == WIN_TIMELIMIT) and team == TEAM_INNOCENT)
            local collectedStats = GetPlayerStats(ply)

            table.insert(finalPayload, {
                steamId = sid,
                kills = collectedStats.kills,
                teamKills = collectedStats.teamKills,
                deaths = collectedStats.deaths,
                damage = collectedStats.damage,
                teamDamage = collectedStats.teamDamage,
                win = won,
                wasTraitor = team == TEAM_TRAITOR
            })
        end
    end

    HTTP({
        url = ApiBase .. "/roundEnd",
        method = "POST",
        type = "application/json",
        body = util.TableToJSON({ players = finalPayload })
    })

    DeadPlayers = {}
    RoundStats = {}
end)
