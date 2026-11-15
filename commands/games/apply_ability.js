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
    name: "تطبيق",
    aliases: ["تطبيق_قدرة", "تطبيق_قدرات", "تطبيق قدرة", "تطبيق قدره", "تطبيق قدرات"],
    async execute({ sock, msg, from, sender, args }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, cards: [], abilityInventory: [], pendingAbilities: {} };
        
        if (!user.abilityInventory || user.abilityInventory.length === 0) {
            return sock.sendMessage(from, { text: "❌ شنطة القدرات بتاعتك فاضية. اسحب الأول بـ .سحب قدرة" }, { quoted: msg });
        }

        if (normalizeArabic(args[0]) === "قدره" || normalizeArabic(args[0]) === "قدرات") {
            args.shift();
        }

        const cardName = args.join(" ").trim();
        if (!cardName) {
            return sock.sendMessage(from, { text: "❌ اكتب اسم البطاقة اللي عايز تحطلها القدرة. مثال: .تطبيق قدرة ايرين" }, { quoted: msg });
        }

        const card = user.cards.find(c => isCloseEnough(cardName, c.name));
        if (!card) return sock.sendMessage(from, { text: `❌ مفيش بطاقة اسمها *${cardName}* في حقيبتك.` }, { quoted: msg });

        user.abilityInventory.sort((a, b) => b.power - a.power);
        const newAbility = user.abilityInventory[0];

        if (!card.abilities) card.abilities = [];

        if (card.abilities.length < 2) {
            card.abilities.push(newAbility);
            card.power += newAbility.power;
            user.abilityInventory.shift();
            
            db[sender] = user;
            saveDB(db);

            return sock.sendMessage(from, { 
                text: `🎉 *تم التطبيق بنجاح!*\n\nتم دمج *${newAbility.name}* (+${newAbility.power}) مع بطاقة *${card.name}*.\n⚔️ قوة البطاقة الجديدة: *${card.power}*`,
                mentions: [sender]
            }, { quoted: msg });
        }

        const weakestAbility = card.abilities.reduce((prev, curr) => (prev.power < curr.power) ? prev : curr);

        if (newAbility.power > weakestAbility.power) {
            if (!user.pendingAbilities) user.pendingAbilities = {};
            user.pendingAbilities[card.name] = newAbility;
            user.abilityInventory.shift();
            
            db[sender] = user;
            saveDB(db);

            return sock.sendMessage(from, { 
                text: `⚡ *البطاقة دي مليانة بقدرتين!*\n\nالقدرة الجديدة: *${newAbility.name}* (+${newAbility.power})\nأضعف قدرة عندك هي: *${weakestAbility.name}* (+${weakestAbility.power}).\n\nعشان تبدل، اكتب:\n*.تبديل ${card.name} ${weakestAbility.name}*`,
                mentions: [sender]
            }, { quoted: msg });
        } else {
            return sock.sendMessage(from, { text: `❌ القدرة دي أضعف من القدرات اللي على البطاقة. سيبها في الشنطة واستخدمها لبطاقة تانية.` }, { quoted: msg });
        }
    }
};
