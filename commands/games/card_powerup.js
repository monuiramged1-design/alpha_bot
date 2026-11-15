const { loadDB, saveDB } = require('../../handlers/cardsDB');
const { isMatch } = require('../../handlers/typoTolerance');

module.exports = {
    name: "ترقية",
    aliases: ["ترقيه"],
    async execute({ sock, msg, from, sender, args }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, cards: [] };
        
        if (!user.cards || user.cards.length === 0) return sock.sendMessage(from, { text: "🎒 حقيبتك فاضية." }, { quoted: msg });
        
        const cardName = args.join(" ").trim();
        if (!cardName) return sock.sendMessage(from, { text: "❌ اكتب اسم البطاقة." }, { quoted: msg });

        const card = user.cards.find(c => isMatch(cardName, c.name));
        if (!card) return sock.sendMessage(from, { text: `❌ مفيش بطاقة اسمها *${cardName}* في حقيبتك.` }, { quoted: msg });

        const pointsNeeded = 100;
        if ((user.points || 0) < pointsNeeded) {
            return sock.sendMessage(from, { 
                text: `❌ محتاج *${pointsNeeded} نقطة* عشان ترفع قوة البطاقة.\n💰 نقاطك الحالية: *${user.points || 0}*\n📉 ناقصك: *${pointsNeeded - (user.points || 0)} نقطة*.` 
            }, { quoted: msg });
        }

        user.points -= pointsNeeded;
        card.power += 5;
        db[sender] = user;
        saveDB(db);

        let emoji = card.rarity === "ميثك" ? "🔮" : card.rarity === "أسطوري" ? "🌟" : card.rarity === "خارق" ? "🔥" : card.rarity === "نادر" ? "💎" : "🎴";

        await sock.sendMessage(from, {
            text: `⚡ *تم الترقية!*\n${emoji} *${card.name}*\n📈 القوة الجديدة: *${card.power}* (+5)\n💰 خصمنا منك: *${pointsNeeded} نقطة*\n📊 نقاطك المتبقية: *${user.points}*`,
            mentions: [sender]
        }, { quoted: msg });
    }
};
