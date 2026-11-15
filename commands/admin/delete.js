module.exports = {
  name: "delete", aliases: ["del"], groupOnly: true,
  async execute({ sock, msg, from, sender, config }) {
    if (!config.ownerNumbers.includes(sender.split("@")[0]) && !await global.checkAdmin(sock, from, sender)) return;
    const quoted = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
    if (!quoted) return sock.sendMessage(from, { text: "❌ رد على الرسالة اللي عايز تمسحها." }, { quoted: msg });
    await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: quoted, participant: msg.message.extendedTextMessage.contextInfo.participant } });
  }
};
