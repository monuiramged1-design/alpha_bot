const { loadDB } = require('../../handlers/cardsDB');

module.exports = {
    name: "ترتيب_الابطال",
    aliases: ["تトップ"],
    async execute({ sock, msg, from }) {
        const db = loadDB();
        const sorted = Object.entries(db).sort((a, b) => (b[1].points || 0) - (a[1].points || 0)).slice(0, 10);
        
        if (sorted.length === 0) return sock.sendMessage(from, { text: "❌ مفيش أباطرة لسه." });
        
        let text = "🏆 *لوحة الشرف - أقوى الأبطال:*\n\n";
        sorted.forEach(([id, data], i) => {
            text += `${i+1}. @${id.split('@')[0]} - النقاط: ${data.points || 0} 💰\n`;
        });
        
        await sock.sendMessage(from, { text, mentions: sorted.map(s => s[0]) }, { quoted: msg });
    }
};
