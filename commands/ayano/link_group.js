module.exports = {
  name: "رابط_غروب", aliases: ["link_gp"], groupOnly: true,
  async execute({ sock, msg, from }) {
    try {
      const code = await sock.groupInviteCode(from);
      await sock.sendMessage(from, { text: `🔗 رابط الجروب:\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
    } catch(e) { await sock.sendMessage(from, { text: "❌ فشل جلب الرابط، تأكد أن البوت مشرف." }, { quoted: msg }); }
  }
};
