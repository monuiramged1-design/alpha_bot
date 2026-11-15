const { loadDB } = require('../../handlers/cardsDB');

module.exports = {
    name: "حقيبتي",
    aliases: ["بطاقاتي"],
    async execute({ sock, msg, from, sender }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, cards: [], abilityInventory: [] };
        
        let text = `🎒 *حقيبة @${sender.split('@')[0]}:*\n💰 النقاط: ${user.points || 0}\n\n`;
        
        if (user.abilityInventory && user.abilityInventory.length > 0) {
            text += `⚡ *شنطة القدرات (غير مستخدمة):*\n`;
            user.abilityInventory.forEach((a, i) => {
                text += `${i+1}. ${a.name} (+${a.power})\n`;
            });
            text += `\n`;
        }

        if (!user.cards || user.cards.length === 0) {
            text += `🎴 لا يوجد بطاقات في حقيبتك.`;
        } else {
            text += `🎴 *البطاقات:*\n`;
            user.cards.forEach((c, i) => {
                let emoji = c.rarity === "ميثك" ? "🔮" : c.rarity === "أسطوري" ? "🌟" : c.rarity === "خارق" ? "🔥" : c.rarity === "نادر" ? "💎" : "🎴";
                text += `${i+1}. ${emoji} *${c.name}* (${c.rarity}) - قوة: ${c.power}\n`;
                if (c.abilities && c.abilities.length > 0) {
                    text += `   ⚡ القدرات: ${c.abilities.map(a => `${a.name} (+${a.power})`).join(" | ")}\n`;
                }
                text += `\n`;
            });
        }
        
        // 🌟 التعديل هنا: لو الإخفاء شغال يبعت خاص، لو مقفول يبعت في الجروب
        if (user.hideCards) {
            try {
                await sock.sendMessage(sender, { text });
                await sock.sendMessage(from, { 
                    text: `📩 تم إرسال حقيبتك في الخاص يا @${sender.split('@')[0]} (لأنك مفعل الإخفاء).`,
                    mentions: [sender]
                }, { quoted: msg });
            } catch (error) {
                await sock.sendMessage(from, { 
                    text: `❌ مقدرتش أبعتلك في الخاص يا @${sender.split('@')[0]}. تأكد إنك مسامح للبوت يبعتلك رسايل.`,
                    mentions: [sender]
                }, { quoted: msg });
            }
        } else {
            // يبعت في الجروب عادي
            await sock.sendMessage(from, { text, mentions: [sender] }, { quoted: msg });
        }
    }
};
