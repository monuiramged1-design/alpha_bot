module.exports = {
  name: "lid", groupOnly: true,
  async execute({ sock, msg, from, sender }) {
    await sock.sendMessage(from, { text: `🆔 الـ ID الخاص بك:\n\`${sender}\`` }, { quoted: msg });
  }
};
