const fs = require("fs");
const path = require("path");
const RANKS_FILE = path.join(__dirname, "..", "..", "data", "ranks.json");

const ranks = [
    { min: 0, name: "🌱 1. ظل مبتدئ" },
    { min: 50, name: "🗡️ 2. ظل صاعد" },
    { min: 100, name: "⚔️ 3. محارب الظل" },
    { min: 150, name: "🏹 4. صياد الظلال" },
    { min: 200, name: "🥷 5. قاتل الظلام" },
    { min: 250, name: "👁️ 6. سيد الظل" },
    { min: 300, name: "🖤 7. نائب الملك" },
    { min: 1000, name: "👑 8. ملك الظلام" }
];

module.exports = {
  name: "up",
  async execute({ sock, msg, from, sender }) {
    const senderId = sender.split("@")[0];
    const pushName = msg.pushName || "عضو";

    let ranksData = {};
    if (fs.existsSync(RANKS_FILE)) {
        ranksData = JSON.parse(fs.readFileSync(RANKS_FILE, "utf8"));
    }

    if (!ranksData[senderId]) {
        ranksData[senderId] = { points: 0, lastUp: 0, name: pushName };
    }

    const user = ranksData[senderId];
    const now = Date.now();
    const cooldown = 60 * 60 * 1000; // ساعة

    if (now - user.lastUp < cooldown) {
        const remaining = Math.ceil((cooldown - (now - user.lastUp)) / 60000);
        return sock.sendMessage(from, { text: `⏳ استنى ${remaining} دقيقة عشان تقدر تعمل up تاني.` }, { quoted: msg });
    }

    const oldRank = [...ranks].reverse().find(r => user.points >= r.min);
    user.points += 10;
    user.lastUp = now;
    user.name = pushName;

    const newRank = [...ranks].reverse().find(r => user.points >= r.min);

    fs.writeFileSync(RANKS_FILE, JSON.stringify(ranksData, null, 2));

    if (newRank.name !== oldRank.name) {
        await sock.sendMessage(from, { text: `مبروك 🎉 يا @${senderId}\nترقيت لـ ${newRank.name}\nنقاطك الحالية: ${user.points} نقطة`, mentions: [sender] }, { quoted: msg });
    } else {
        await sock.sendMessage(from, { text: `✅ تم إضافة 10 نقاط يا @${senderId}\nنقاطك الحالية: ${user.points} نقطة`, mentions: [sender] }, { quoted: msg });
    }
  }
};
