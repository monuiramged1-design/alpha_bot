module.exports = {
  name: "setayanokoji", groupOnly: true,
  async execute({ sock, msg, from, config, sender, args }) {
    if (!config.ownerNumbers.includes(sender.split("@")[0])) return;
    if (!args.length) return sock.sendMessage(from, { text: "❌ اكتب الاسم الجديد للبوت." }, { quoted: msg });
    const newName = args.join(" ");
    try {
      await sock.updateProfileName(newName);
      await sock.sendMessage(from, { text: `✅ تم تغيير اسم البوت إلى: *${newName}*` }, { quoted: msg });
    } catch(e) { await sock.sendMessage(from, { text: `❌ فشل تغيير الاسم.` }, { quoted: msg }); }
  }
};
