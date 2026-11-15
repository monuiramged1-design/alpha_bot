const { requireAdmin, requireBotAdmin } = require("../../handlers/permission");
module.exports = {
  name: "upa", groupOnly: true,
  async execute({ sock, msg, from, sender }) {
    if (!await requireAdmin(sock, from, sender)) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg });
    if (!await requireBotAdmin(sock, from)) return sock.sendMessage(from, { text: "❌ البوت لازم يكون أدمن." }, { quoted: msg });
    const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: "❌ منشن عضو." }, { quoted: msg });
    try {
      const meta = await sock.groupMetadata(from);
      const idsToAction = mentions.map(mention => {
        const clean = mention.split("@")[0];
        const p = meta.participants.find(x => x.id.includes(clean) || (x.lid && x.lid.includes(clean)));
        return p ? p.id : mention;
      });
      await sock.groupParticipantsUpdate(from, idsToAction, "promote");
      await sock.sendMessage(from, { text: `✅ تم رفع العضو لمشرف.`, mentions });
    } catch (e) { await sock.sendMessage(from, { text: "❌ فشل الرفع." }); }
  }
};
