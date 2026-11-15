module.exports = {
  name: "ayhidden", groupOnly: true,
  async execute({ sock, msg, from, config, sender }) {
    if (!config.ownerNumbers.includes(sender.split("@")[0])) return;
    const g = global.groupSettings[from] ||= {};
    g.hidden = !g.hidden;
    global.saveGroups();
    await sock.sendMessage(from, { text: `🕵️ وضع الاختفاء: ${g.hidden ? "مفعل ✅" : "متوقف ❌"}` }, { quoted: msg });
  }
};
