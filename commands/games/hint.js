module.exports = {
  name: "تلميح",
  async execute({ sock, msg, from }) {
    if (global.gameHints && global.gameHints[from]) {
      await sock.sendMessage(from, { text: `💡 *تلميح:* ${global.gameHints[from]}` }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: "❌ لا توجد لعبة شغالة حالياً لتقديم تلميح لها." }, { quoted: msg });
    }
  }
};
