--------------------------------------------------------
-- custom_names_client.lua
-- Client: display DisplayName (from NW2String) instead of Steam name
-- Place in: lua/autorun/client/custom_names_client.lua
--------------------------------------------------------

if not CLIENT then
    return
end

local meta = FindMetaTable("Player")
if meta and not meta._CN_OriginalNick then
    -- Helper function to get display name
    local function getDisplayName(ply, origFunc)
        local name = (ply.GetNW2String and ply:GetNW2String("DisplayName", "") or ply:GetNWString("DisplayName", ""))
        return (name ~= "" and name) or origFunc(ply)
    end

    -- Override Nick()
    local origNick = meta.Nick
    function meta:Nick()
        return getDisplayName(self, origNick)
    end
    meta._CN_OriginalNick = origNick

    -- Override Name() - used by some scoreboards
    if meta.Name then
        local origName = meta.Name
        function meta:Name()
            return getDisplayName(self, origName)
        end
        meta._CN_OriginalName = origName
    end

    -- Override GetName() - also used by some UI elements
    if meta.GetName then
        local origGetName = meta.GetName
        function meta:GetName()
            return getDisplayName(self, origGetName)
        end
        meta._CN_OriginalGetName = origGetName
    end
end
