const { loadDB, saveDB } = require('../../handlers/cardsDB');

function normalizeArabic(text) {
    if (!text) return "";
    return text.replace(/[\u064B-\u065F]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/[ىي]/g, "ي").replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isCloseEnough(input, target) {
    const a = normalizeArabic(input);
    const b = normalizeArabic(target);
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    return false;
}

module.exports = {
    name: "بيع",
    async execute({ sock, msg, from, sender, args }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, cards: [], abilityInventory: [] };
        
        if (!args.length) return sock.sendMessage(from, { text: "❌ اكتب اسم البطاقة أو القدرة اللي عايز تبيعها." }, { quoted: msg });

        // بيع القدرات
        if (normalizeArabic(args[0]) === "قدره" || normalizeArabic(args[0]) === "قدرات") {
            const abilityName = args.slice(1).join(" ").trim();
            if (!abilityName) return sock.sendMessage(from, { text: "❌ اكتب اسم القدرة اللي عايز تبيعها." }, { quoted: msg });

            if (!user.abilityInventory || user.abilityInventory.length === 0) return sock.sendMessage(from, { text: "⚡ شنطة القدرات فاضية." }, { quoted: msg });

            const abilityIndex = user.abilityInventory.findIndex(a => isCloseEnough(abilityName, a.name));
            if (abilityIndex === -1) return sock.sendMessage(from, { text: `❌ مفيش قدرة اسمها *${abilityName}* في شنطتك.` }, { quoted: msg });

            const soldAbility = user.abilityInventory.splice(abilityIndex, 1)[0];
            // 🌟 التعديل: بيع القدرة بضعف قوتها
            const pointsEarned = soldAbility.power * 2; 
            
            if (!user.points) user.points = 0;
            user.points += pointsEarned;
            db[sender] = user;
            saveDB(db);

            return sock.sendMessage(from, { text: `💰 *تم بيع القدرة بنجاح!*\n\nتم بيع ⚡ *${soldAbility.name}*.\n💵 حصلت على: *+${pointsEarned} نقطة*\n📊 إجمالي نقاطك: *${user.points}*`, mentions: [sender] }, { quoted: msg });
        }

        // بيع البطاقات
        if (!user.cards || user.cards.length === 0) return sock.sendMessage(from, { text: "🎒 حقيبتك فاضية." }, { quoted: msg });

        const cardName = args.join(" ").trim();
        const cardIndex = user.cards.findIndex(c => isCloseEnough(cardName, c.name));
        
        if (cardIndex === -1) return sock.sendMessage(from, { text: `❌ مفيش بطاقة اسمها *${cardName}* في حقيبتك.` }, { quoted: msg });

        const soldCard = user.cards.splice(cardIndex, 1)[0];
        // 🌟 التعديل: بيع البطاقة بتلت قوتها
        const pointsEarned = Math.floor(soldCard.power / 3); 
        
        if (!user.points) user.points = 0;
        user.points += pointsEarned;
        db[sender] = user;
        saveDB(db);

        await sock.sendMessage(from, { text: `💰 *تم البيع بنجاح!*\n\nتم بيع بطاقة *${soldCard.name}* (قوة: ${soldCard.power}).\n💵 حصلت على: *+${pointsEarned} نقطة*\n📊 إجمالي نقاطك: *${user.points}*`, mentions: [sender] }, { quoted: msg });
    }
};
