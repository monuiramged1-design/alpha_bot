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
    name: "تطوير",
    async execute({ sock, msg, from, sender, args }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, cards: [] };
        if (!user.cards || user.cards.length === 0) return sock.sendMessage(from, { text: "🎒 حقيبتك فاضية." }, { quoted: msg });

        const cardName = args.join(" ").trim();
        let targetCard = null;

        if (cardName) {
            const matches = user.cards.filter(c => isCloseEnough(cardName, c.name));
            if (matches.length >= 3) targetCard = matches[0];
        } else {
            const counts = {};
            user.cards.forEach(c => { counts[c.name] = (counts[c.name] || 0) + 1; });
            for (const name in counts) {
                if (counts[name] >= 3) { targetCard = user.cards.find(c => c.name === name); break; }
            }
        }

        if (!targetCard) return sock.sendMessage(from, { text: "❌ محتاج 3 بطاقات من نفس الشخصية عشان تقدر تطورها." }, { quoted: msg });

        const targetCardName = targetCard.name;
        const oldRarity = targetCard.rarity;

        let removed = 0;
        user.cards = user.cards.filter(c => {
            if (isCloseEnough(c.name, targetCardName) && removed < 3) { removed++; return false; }
            return true;
        });

        let newRarity = "عادي", minP = 10, maxP = 40;
        if (oldRarity === "عادي") { newRarity = "نادر"; minP = 60; maxP = 100; }
        else if (oldRarity === "نادر") { newRarity = "خارق"; minP = 120; maxP = 180; }
        else if (oldRarity === "خارق") { newRarity = "أسطوري"; minP = 200; maxP = 250; }
        else if (oldRarity === "أسطوري") { newRarity = "ميثك"; minP = 300; maxP = 400; }
        else { newRarity = "ميثك+"; minP = 400; maxP = 500; }

        const newPower = Math.floor(Math.random() * (maxP - minP + 1)) + minP;
        const upgradedCard = { name: targetCardName, rarity: newRarity, power: newPower };

        user.cards.push(upgradedCard);
        db[sender] = user;
        saveDB(db);

        let emoji = newRarity === "ميثك" || newRarity === "ميثك+" ? "🔮" : newRarity === "أسطوري" ? "🌟" : newRarity === "خارق" ? "🔥" : "💎";

        await sock.sendMessage(from, { text: `🎉 *تطوير ناجح!*\n\nتم دمج 3 بطاقات من *${targetCardName}*.\nترقت لتصبح:\n${emoji} *${upgradedCard.name}* (${upgradedCard.rarity})\n⚔️ القوة الجديدة: *${upgradedCard.power}*`, mentions: [sender] }, { quoted: msg });
    }
};
