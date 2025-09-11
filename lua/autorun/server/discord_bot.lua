if not SERVER then
    return
end

print("[TTTDiscordBot] Server-side script loaded")

local ApiBase = "http://ttthost:3000/api"

-- ========= State =========
local DeadPlayers = {}
local RoundStats = {}
local preEHP = {}

-- ========= Helpers =========
local function IsValidPlayer(ply)
    return IsValid(ply) and ply:IsPlayer() and not ply:IsBot()
end

local function IsActiveRound()
    return GetRoundState() == ROUND_ACTIVE
end

local function GetTeamId(ply)
    if not IsValidPlayer(ply) then
        return TEAM_NONE or -1
    end
    local t = ply.GetTeam and ply:GetTeam() or (TEAM_NONE or -1)
    return t or (TEAM_NONE or -1)
end

local function IsLastAliveInTeam(victim)
    local teamId = GetTeamId(victim)
    if teamId == (TEAM_NONE or -1) then
        return false
    end
    for _, ply in player.Iterator() do
        if IsValidPlayer(ply) and ply ~= victim and ply:Alive() and ply:IsTerror()
                and GetTeamId(ply) == teamId
        then
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

    if IsValidPlayer(attacker) then
        return attacker
    end
    if IsValidPlayer(inflictor) then
        return inflictor
    end

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

    if IsValid(attacker) and attacker.GetPhysicsAttacker then
        local phys = attacker:GetPhysicsAttacker(5)
        if IsValidPlayer(phys) then
            return phys
        end
    end

    if IsValid(attacker) and attacker.CPPIGetOwner then
        local owner = attacker:CPPIGetOwner()
        if IsValidPlayer(owner) then
            return owner
        end
    end

    return nil
end

local function GetPlayerStats(ply)
    local sid = ply:SteamID64()
    local stats = RoundStats[sid]
    if not stats then
        stats = { damage = 0, teamDamage = 0, kills = 0, teamKills = 0, deaths = 0 }
        RoundStats[sid] = stats
    end
    return stats
end

local function ToTeamKey(v)
    if isstring(v) then
        return string.Trim(string.lower(v))
    end

    if isnumber(v) then
        if WIN_TIMELIMIT and v == WIN_TIMELIMIT then
            return "innocents"
        end
        if WIN_TRAITOR and v == WIN_TRAITOR then
            return "traitors"
        end
        if WIN_INNOCENT and v == WIN_INNOCENT then
            return "innocents"
        end
    end

    return tostring(v)
end

local function PlayerWon(ply, result)
    local teamKey = ToTeamKey(ply:GetTeam())
    local resKey = ToTeamKey(result)

    return teamKey == resKey
end

-- ========= Hooks =========
hook.Add("TTTBeginRound", "TTTDiscordRoundStart", function()
    http.Post(ApiBase .. "/roundStart", {}, nil, nil)
    table.Empty(preEHP)
end)

hook.Add("PlayerDeath", "TTTDiscordDeath", function(victim, inflictor, attacker)
    if not IsActiveRound() or not IsValidPlayer(victim) then
        return
    end

    local victimStats = GetPlayerStats(victim)
    victimStats.deaths = victimStats.deaths + 1

    if IsValidPlayer(attacker) and victim ~= attacker then
        local atkStats = GetPlayerStats(attacker)
        if GetTeamId(victim) ~= GetTeamId(attacker) then
            atkStats.kills = atkStats.kills + 1
        else
            atkStats.teamKills = atkStats.teamKills + 1
        end
    end

    timer.Simple(0, function()
        if not IsActiveRound() or not IsValidPlayer(victim) then
            return
        end
        if not victim:Alive() and not IsLastAliveInTeam(victim) then
            http.Post(ApiBase .. "/dead", { steamId = victim:SteamID64() }, nil, nil)
            DeadPlayers[victim:SteamID64()] = true
        end
    end)
end)

hook.Add("PlayerSpawn", "TTTDiscordSpawn", function(ply)
    if not IsValidPlayer(ply) or not DeadPlayers[ply:SteamID64()] then
        return
    end
    http.Post(ApiBase .. "/spawn", { steamId = ply:SteamID64() }, nil, nil)
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

    local dmg = math.Clamp(before - after, 0, before)
    if dmg <= 0 then
        return
    end

    local atkStats = GetPlayerStats(attacker)
    if GetTeamId(target) ~= GetTeamId(attacker) then
        atkStats.damage = atkStats.damage + dmg
    else
        atkStats.teamDamage = atkStats.teamDamage + dmg
    end
end)

hook.Add("TTTEndRound", "TTTDiscordRoundEnd", function(result)
    local finalPayload = {}

    for _, ply in player.Iterator() do
        if IsValidPlayer(ply) and ply:GetRole() then
            local sid = ply:SteamID64()
            local team = GetTeamId(ply)
            local won = PlayerWon(ply, result)

            local stats = GetPlayerStats(ply)
            table.insert(finalPayload, {
                steamId = sid,
                kills = stats.kills,
                teamKills = stats.teamKills,
                deaths = stats.deaths,
                damage = stats.damage,
                teamDamage = stats.teamDamage,
                win = won,
                wasTraitor = (team == TEAM_TRAITOR)
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
    table.Empty(preEHP)
end)
