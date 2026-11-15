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
  name: "myrank",
  async execute({ sock, msg, from, sender }) {
    const senderId = sender.split("@")[0];
    const pushName = msg.pushName || "عضو";

    let ranksData = {};
    if (fs.existsSync(RANKS_FILE)) {
        ranksData = JSON.parse(fs.readFileSync(RANKS_FILE, "utf8"));
    }

    if (!ranksData[senderId]) {
        ranksData[senderId] = { points: 0, lastUp: 0, name: pushName };
        fs.writeFileSync(RANKS_FILE, JSON.stringify(ranksData, null, 2));
    }

    const user = ranksData[senderId];
    const currentRank = [...ranks].reverse().find(r => user.points >= r.min);
    
    const nextRank = ranks.find(r => r.min > user.points);
    let nextText = "";
    
    if (nextRank) {
        const needed = nextRank.min - user.points;
        nextText = `فاضلك : ${needed} نقطة و تبقى ${nextRank.name}`;
    } else {
        nextText = `إنت وصلت لأعلى رتبة! 👑`;
    }

    await sock.sendMessage(from, { 
        text: `『 Ghio is here 』\n『 My Rank - رتبتك 』\n\nاسمك : ${user.name}\nرتبتك : ${currentRank.name}\nنقاطك : ${user.points} نقطة\n${nextText}\n\n─「 Ghio Bot 」─╮`, 
        mentions: [sender] 
    }, { quoted: msg });
  }
};
