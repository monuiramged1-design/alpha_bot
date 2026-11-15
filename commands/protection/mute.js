const { requireAdmin } = require("../../handlers/permission");
module.exports = {
  name: "mute", aliases: ["unmute"], groupOnly: true,
  async execute({ sock, msg, from, sender, raw }) {
    if (!await requireAdmin(sock, from, sender)) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg });
    const g = global.groupSettings[from] ||= {};
    g.muted = raw.startsWith(".mute");
    global.saveGroups();
    await sock.sendMessage(from, { text: `🔇 الجروب: ${g.muted ? "مقفول" : "مفتوح"}` }, { quoted: msg });
  }
};
