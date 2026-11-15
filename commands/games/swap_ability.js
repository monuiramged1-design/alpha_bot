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
    name: "تبديل",
    async execute({ sock, msg, from, sender, args }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, cards: [], pendingAbilities: {} };
        
        const cardName = args[0];
        const oldAbilityName = args.slice(1).join(" ");

        if (!cardName || !oldAbilityName) return sock.sendMessage(from, { text: "❌ اكتب الأمر كامل. مثال: .تبديل ايرين راسينجان" }, { quoted: msg });

        const card = user.cards.find(c => isCloseEnough(cardName, c.name));
        if (!card) return sock.sendMessage(from, { text: `❌ مفيش بطاقة اسمها *${cardName}*.` }, { quoted: msg });

        if (!user.pendingAbilities || !user.pendingAbilities[card.name]) {
            return sock.sendMessage(from, { text: "❌ مفيش قدرة جديدة معلقة للبطاقة دي عشان تبدلها." }, { quoted: msg });
        }

        const oldAbilityIndex = card.abilities.findIndex(a => isCloseEnough(oldAbilityName, a.name));
        if (oldAbilityIndex === -1) return sock.sendMessage(from, { text: `❌ القدرة *${oldAbilityName}* مش موجودة في البطاقة دي.` }, { quoted: msg });

        const oldAbility = card.abilities[oldAbilityIndex];
        const newAbility = user.pendingAbilities[card.name];

        card.power -= oldAbility.power;
        card.abilities.splice(oldAbilityIndex, 1);
        card.abilities.push(newAbility);
        card.power += newAbility.power;

        delete user.pendingAbilities[card.name];
        db[sender] = user;
        saveDB(db);

        await sock.sendMessage(from, { text: `🔄 *تم التبديل بنجاح!*\n\nتم استبدال *${oldAbility.name}* بـ *${newAbility.name}* في بطاقة *${card.name}*.\n⚔️ قوة البطاقة الجديدة: *${card.power}*`, mentions: [sender] }, { quoted: msg });
    }
};
