const { requireAdmin, requireBotAdmin } = require("../../handlers/permission");
module.exports = {
  name: "lock", aliases: ["unlock"], groupOnly: true,
  async execute({ sock, msg, from, sender, raw }) {
    if (!await requireAdmin(sock, from, sender)) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg });
    if (!await requireBotAdmin(sock, from)) return sock.sendMessage(from, { text: "❌ البوت لازم يكون أدمن." }, { quoted: msg });
    const locked = raw.startsWith(".lock");
    await sock.groupSettingUpdate(from, locked ? "announcement" : "not_announcement");
    await sock.sendMessage(from, { text: locked ? "🔒 الجروب اتقفل." : "🔓 الجروب اتفتح." }, { quoted: msg });
  }
};
