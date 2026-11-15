module.exports = {
  name: "Rit",
  groupOnly: true,
  async execute({ sock, msg, from, config, sender, args }) {
    if (!config.ownerNumbers.includes(sender.split("@")[0])) return; // للأونر بس
    if (!args.length) return sock.sendMessage(from, { text: "❌ اكتب on أو off." }, { quoted: msg });
    
    const state = args[0].toLowerCase();
    const g = global.groupSettings[from] ||= {};
    
    if (state === "on") {
      g.rit = true;
      global.saveGroups();
      await sock.sendMessage(from, { text: "✅ تم تفعيل وضع (Rit) التفاعلي في الجروب." }, { quoted: msg });
    } else if (state === "off") {
      g.rit = false;
      global.saveGroups();
      await sock.sendMessage(from, { text: "❌ تم إيقاف وضع (Rit)." }, { quoted: msg });
    }
  }
};
