const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: "setimage",
  async execute({ sock, msg, from, config, sender }) {
    if (!config.ownerNumbers.includes(sender.split("@")[0])) return;

    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || !quoted.imageMessage) {
      return sock.sendMessage(from, { text: "❌ اعمل ريبلاي (رد) على الصورة اللي عايز تحطها للمنيو واكتب .setimage" }, { quoted: msg });
    }

    try {
      // سحب الصورة من واتساب
      const buffer = await downloadMediaMessage(
        { message: quoted, key: msg.key },
        'buffer',
        {},
        { logger: console }
      );
      
      // حفظ الصورة في فولدر البوت
      const imgPath = path.join(__dirname, "..", "..", "ayano.jpg");
      fs.writeFileSync(imgPath, buffer);
      
      await sock.sendMessage(from, { text: "✅ تم حفظ الصورة بنجاح في البوت! جرب تكتب .geo دلوقتي." }, { quoted: msg });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(from, { text: "❌ حصل خطأ في حفظ الصورة. تأكد إنها صورة ومبعوتة عادي." }, { quoted: msg });
    }
  }
};
