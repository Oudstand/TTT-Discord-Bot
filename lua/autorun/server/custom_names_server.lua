--------------------------------------------------------
-- custom_names_server.lua
-- Server: fetch display names from backend once per join
-- Place in: lua/autorun/server/custom_names_server.lua
--------------------------------------------------------
if not SERVER then
    return
end

AddCSLuaFile("autorun/client/custom_names_client.lua")

local ApiBase = "http://ttthost:3000/api"

local function getName(p)
    return (p.GetNW2String and p:GetNW2String("DisplayName", "") or p:GetNWString("DisplayName", ""))
end
local function setName(p, n)
    if p.SetNW2String then
        p:SetNW2String("DisplayName", n)
    else
        p:SetNWString("DisplayName", n)
    end
end

local function fetch(ply, tries)
    if not IsValid(ply) or ply:IsBot() or ply._cn_done or ply._cn_fetching or getName(ply) ~= "" then
        return
    end
    ply._cn_fetching = true

    local steamId = ply:SteamID64()
    if not steamId or steamId == "NULL" then
        ply._cn_fetching = nil
        return
    end

    tries = (tries or 0)

    HTTP({
        url = ApiBase .. "/bindings/" .. steamId,
        method = "GET",
        success = function(code, body)
            ply._cn_fetching = nil
            if not IsValid(ply) then
                return
            end

            if code == 200 then
                local ok, data = pcall(util.JSONToTable, body or "")
                local name = (ok and type(data) == "table" and tostring(data.name or "")) or ""
                if name ~= "" and getName(ply) ~= name then
                    setName(ply, name)
                end
                ply._cn_done = true
            elseif code == 404 then
                ply._cn_done = true
            else
                if tries < 2 then
                    timer.Simple(1, function()
                        fetch(ply, tries + 1)
                    end)
                end
            end
        end,
        failed = function(err)
            ply._cn_fetching = nil
            if tries < 2 then
                timer.Simple(1, function()
                    fetch(ply, tries + 1)
                end)
            end
        end
    })
end

hook.Add("PlayerInitialSpawn", "CustomNames_FetchOnJoin", function(ply)
    timer.Simple(0.5, function()
        fetch(ply, 0)
    end)
end)
