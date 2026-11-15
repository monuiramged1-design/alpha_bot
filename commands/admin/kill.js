const { requireAdmin, requireBotAdmin } = require("../../handlers/permission");
module.exports = {
  name: "kill", aliases: ["killall"], groupOnly: true,
  async execute({ sock, msg, from, sender, raw }) {
    if (!await requireAdmin(sock, from, sender)) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg });
    if (!await requireBotAdmin(sock, from)) return sock.sendMessage(from, { text: "❌ البوت لازم يكون أدمن." }, { quoted: msg });
    
    const meta = await sock.groupMetadata(from);

    if (raw.startsWith(".killall")) {
      const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const ids = meta.participants.map(p => p.id).filter(id => id !== botId);
      try { await sock.groupParticipantsUpdate(from, ids, "remove"); await sock.sendMessage(from, { text: `💀 تم طرد ${ids.length} عضو.` }); } catch(e){}
      return;
    }

    const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(from, { text: "❌ منشن عضو." }, { quoted: msg });
    
    try {
      const idsToAction = mentions.map(mention => {
        const clean = mention.split("@")[0];
        const p = meta.participants.find(x => x.id.includes(clean) || (x.lid && x.lid.includes(clean)));
        return p ? p.id : mention;
      });
      await sock.groupParticipantsUpdate(from, idsToAction, "remove");
      await sock.sendMessage(from, { text: `💀 تم الطرد.`, mentions });
    } catch (e) { await sock.sendMessage(from, { text: "❌ م قدرت أطرده. يمكن يكون أدمن." }); }
  }
};
