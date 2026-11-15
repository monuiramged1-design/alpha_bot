const config = require("../config.json");
async function requireAdmin(sock, from, sender) {
  if (config.ownerNumbers.includes(sender.split("@")[0])) return true;
  return await global.checkAdmin(sock, from, sender);
}
async function requireBotAdmin(sock, from) {
  try {
    const meta = await sock.groupMetadata(from);
    const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const botLid = sock.user.lid ? sock.user.lid.split(":")[0] + "@lid" : null;
    
    const p = meta.participants.find(x => 
      x.id === botId || 
      (x.id && x.id.includes(sock.user.id.split(":")[0])) ||
      (botLid && x.id === botLid) ||
      (x.lid && botLid && x.lid === botLid)
    );
    return p?.admin === "admin" || p?.admin === "superadmin";
  } catch (e) { 
    console.error("Error checking bot admin:", e);
    return false; 
  }
}
module.exports = { requireAdmin, requireBotAdmin };
