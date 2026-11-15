module.exports = {
  name: "ayano_del", groupOnly: true,
  async execute({ sock, msg, from, config, sender }) {
    if (!config.ownerNumbers.includes(sender.split("@")[0])) return;
    const quoted = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
    if (!quoted) return sock.sendMessage(from, { text: "❌ رد على رسالة البوت اللي عايز تمسحها." }, { quoted: msg });
    await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: true, id: quoted, participant: msg.message.extendedTextMessage.contextInfo.participant } });
  }
};
