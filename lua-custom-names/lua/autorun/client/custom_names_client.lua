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
    local orig = meta.Nick

    function meta:Nick()
        local name = (self.GetNW2String and self:GetNW2String("DisplayName", "") or self:GetNwString("DisplayName", ""))
        return (name ~= "" and name) or orig(self)
    end

    meta._CN_OriginalNick = orig
end
