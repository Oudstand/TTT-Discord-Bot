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

local function GetEHP(ply)
    if not IsValidPlayer(ply) then
        return 0
    end
    local hp = math.max(tonumber(ply:Health()) or 0, 0)

    local armor = 0
    if isfunction(ply.Armor) then
        armor = tonumber(ply:Armor()) or 0
    elseif isfunction(ply.GetArmor) then
        armor = tonumber(ply:GetArmor()) or 0
    end

    return hp + math.max(armor, 0)
end

local function ResolveAttacker(dmginfo, target)
    local attacker = dmginfo:GetAttacker()
    local inflictor = dmginfo:GetInflictor()

    -- Direkt ein Spieler?
    if IsValidPlayer(attacker) then
        return attacker
    end
    if IsValidPlayer(inflictor) then
        return inflictor
    end

    -- Owner-Kette (z. B. ents, SWEPs, grenades)
    if IsValid(attacker) and attacker.GetOwner then
        local owner = attacker:GetOwner()
        if IsValidPlayer(owner) then
            return owner
        end
    end
    if IsValid(inflictor) and inflictor.GetOwner then
        local owner = inflictor:GetOwner()
        if IsValidPlayer(owner) then
            return owner
        end
    end

    -- Physik-Angreifer (Prop-Push/Throw), 5s Fenster
    if IsValid(attacker) and attacker.GetPhysicsAttacker then
        local phys = attacker:GetPhysicsAttacker(5)
        if IsValidPlayer(phys) then
            return phys
        end
    end

    -- (Optional) CPPI (Prop-Protection) Owner
    if IsValid(attacker) and attacker.CPPIGetOwner then
        local owner = attacker:CPPIGetOwner()
        if IsValidPlayer(owner) then
            return owner
        end
    end

    return nil
end

local preEHP = {}

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
    preEHP = {}
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

    if preEHP[target] == nil then
        preEHP[target] = GetEHP(target)
    end
end)

hook.Add("PostEntityTakeDamage", "TTTTrackDamage_Post", function(target, dmginfo, took)
    if not IsActiveRound() or not IsValidPlayer(target) then
        return
    end
    -- Schaden wurde abgefangen/negiert
    if not took then
        preEHP[target] = nil;
        return
    end

    local attacker = ResolveAttacker(dmginfo, target)
    if not IsValidPlayer(attacker) or attacker == target then
        preEHP[target] = nil
        return
    end

    local before = preEHP[target] or GetEHP(target)
    preEHP[target] = nil

    local after = GetEHP(target)
    local dmg = before - after
    dmg = math.Clamp(dmg, 0, before)

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
