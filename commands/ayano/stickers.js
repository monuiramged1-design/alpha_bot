module.exports = {
  name: "stik_void", aliases: ["stik_upa", "del_stik"],
  async execute({ sock, msg, from }) {
    await sock.sendMessage(from, { text: "🎨 ميزة الملصقات المخصصة قيد التطوير في التحديث القادم!" }, { quoted: msg });
  }
};
