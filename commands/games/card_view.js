const { loadDB } = require('../../handlers/cardsDB');
const abilitiesPool = require('./abilities_pool.json');

const cardsPool = [
    { name: "سايتاما", rarity: "ميثك", minP: 400, maxP: 500 },
    { name: "غوكو", rarity: "ميثك", minP: 380, maxP: 480 },
    { name: "يوهابغ", rarity: "ميثك", minP: 380, maxP: 480 },
    { name: "أيزن", rarity: "ميثك", minP: 350, maxP: 450 },
    { name: "غوجو", rarity: "ميثك", minP: 350, maxP: 450 },
    { name: "سوكونا", rarity: "ميثك", minP: 340, maxP: 440 },
    { name: "مادارا", rarity: "ميثك", minP: 330, maxP: 430 },
    { name: "ناروتو", rarity: "أسطوري", minP: 250, maxP: 320 },
    { name: "ساسكي", rarity: "أسطوري", minP: 250, maxP: 320 },
    { name: "إيتشيغو", rarity: "أسطوري", minP: 260, maxP: 330 },
    { name: "فيجيتا", rarity: "أسطوري", minP: 260, maxP: 330 },
    { name: "لوفي", rarity: "أسطوري", minP: 240, maxP: 310 },
    { name: "بروتو", rarity: "أسطوري", minP: 230, maxP: 300 },
    { name: "يامي", rarity: "أسطوري", minP: 220, maxP: 290 },
    { name: "إرين", rarity: "خارق", minP: 150, maxP: 200 },
    { name: "زورو", rarity: "خارق", minP: 160, maxP: 210 },
    { name: "كيلوا", rarity: "خارق", minP: 140, maxP: 190 },
    { name: "كانيكي", rarity: "خارق", minP: 140, maxP: 190 },
    { name: "تودوروكي", rarity: "خارق", minP: 130, maxP: 180 },
    { name: "ميغومي", rarity: "خارق", minP: 130, maxP: 180 },
    { name: "ليفاي", rarity: "خارق", minP: 120, maxP: 170 },
    { name: "كاكاشي", rarity: "نادر", minP: 80, maxP: 110 },
    { name: "ميكاسا", rarity: "نادر", minP: 70, maxP: 100 },
    { name: "نيزوكو", rarity: "نادر", minP: 70, maxP: 100 },
    { name: "إينوسكي", rarity: "نادر", minP: 70, maxP: 100 },
    { name: "زينيتسو", rarity: "نادر", minP: 75, maxP: 105 },
    { name: "تانجيرو", rarity: "نادر", minP: 80, maxP: 110 },
    { name: "إدوارد", rarity: "نادر", minP: 65, maxP: 95 },
    { name: "أوسوب", rarity: "عادي", minP: 20, maxP: 50 },
    { name: "مينيتا", rarity: "عادي", minP: 10, maxP: 30 },
    { name: "كازوما", rarity: "عادي", minP: 15, maxP: 40 },
    { name: "لايت", rarity: "عادي", minP: 5, maxP: 25 },
    { name: "كيرا", rarity: "عادي", minP: 10, maxP: 35 },
    { name: "أوزوي", rarity: "عادي", minP: 10, maxP: 30 },
    { name: "ساكورا", rarity: "عادي", minP: 20, maxP: 50 },
    { name: "نوبيتا", rarity: "عادي", minP: 5, maxP: 20 }
];

module.exports = {
    name: "عرض",
    groupOnly: true,
    async execute({ sock, msg, from, sender, args }) {
        
        // 🌟 فحص لو المستخدم طلب كتالوج القدرات
        if (args[0] === "القدرات" || args[0] === "قدرات" || args[0] === "قدرة") {
            const rarityArg = args[1];
            const rarityMap = { "عادي": "عادي", "نادر": "نادر", "خارق": "خارق", "أسطوري": "أسطوري", "ميثك": "ميثك" };

            if (!rarityArg || !rarityMap[rarityArg]) {
                return sock.sendMessage(from, {
                    text: `⚡ *كتالوج قدرات الأنمي:*\n\nحدد التصنيف عشان تشوف قدراته:\n\n🎴 .عرض القدرات عادي\n💎 .عرض القدرات نادر\n🔥 .عرض القدرات خارق\n🌟 .عرض القدرات أسطوري\n🔮 .عرض القدرات ميثك`
                }, { quoted: msg });
            }

            const targetRarity = rarityMap[rarityArg];
            const filtered = abilitiesPool.filter(a => a.rarity === targetRarity);
            let emoji = targetRarity === "ميثك" ? "🔮" : targetRarity === "أسطوري" ? "🌟" : targetRarity === "خارق" ? "🔥" : targetRarity === "نادر" ? "💎" : "🎴";

            let text = `${emoji} *قدرات تصنيف (${targetRarity}):*\n\n`;
            filtered.forEach((a, i) => {
                text += `${i+1}. *${a.name}* (+${a.power} قوة)\n`;
            });

            return sock.sendMessage(from, { text }, { quoted: msg });
        }

        // 🌟 فحص لو المستخدم طلب كتالوج البطاقات
        const isCatalog = args[0] === "البطاقات" || args[0] === "بطاقات" || args[0] === "الكتالوج";

        if (isCatalog) {
            const rarityArg = args[1];
            const rarityMap = { "عادي": "عادي", "نادر": "نادر", "خارق": "خارق", "أسطوري": "أسطوري", "ميثك": "ميثك" };

            if (!rarityArg || !rarityMap[rarityArg]) {
                return sock.sendMessage(from, {
                    text: `📖 *كتالوج بطاقات الأنمي:*\n\nحدد التصنيف عشان تشوف بطاقاته:\n\n🎴 .عرض البطاقات عادي\n💎 .عرض البطاقات نادر\n🔥 .عرض البطاقات خارق\n🌟 .عرض البطاقات أسطوري\n🔮 .عرض البطاقات ميثك`
                }, { quoted: msg });
            }

            const targetRarity = rarityMap[rarityArg];
            const filtered = cardsPool.filter(c => c.rarity === targetRarity);
            let emoji = targetRarity === "ميثك" ? "🔮" : targetRarity === "أسطوري" ? "🌟" : targetRarity === "خارق" ? "🔥" : targetRarity === "نادر" ? "💎" : "🎴";

            let text = `${emoji} *بطاقات تصنيف (${targetRarity}):*\n\n`;
            filtered.forEach((c, i) => {
                text += `${i+1}. *${c.name}* (قوة من ${c.minP} إلى ${c.maxP})\n`;
            });

            return sock.sendMessage(from, { text }, { quoted: msg });
        }

        // 🌟 الكود العادي لعرض حقيبة شخص
        const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length === 0) {
            return sock.sendMessage(from, { 
                text: "❌ اعمل منشن للشخص اللي عايز تشوف حقيبته، أو اكتب *.عرض البطاقات [التصنيف]* أو *.عرض القدرات [التصنيف]*" 
            }, { quoted: msg });
        }
        
        const target = mentions[0];
        const db = loadDB();
        const user = db[target] || { points: 0, cards: [] };
        
        if (user.hideCards && target !== sender) {
             return sock.sendMessage(from, { text: `🤫 حقيبة @${target.split('@')[0]} مخفية.` }, { quoted: msg });
        }
        
        if (!user.cards || user.cards.length === 0) return sock.sendMessage(from, { text: `🎒 حقيبة @${target.split('@')[0]} فاضية.` }, { quoted: msg });
        
        let text = `🎒 *حقيبة @${target.split('@')[0]}:*\n💰 النقاط: ${user.points || 0}\n\n`;
        user.cards.forEach((c, i) => {
            let emoji = c.rarity === "ميثك" ? "🔮" : c.rarity === "أسطوري" ? "🌟" : c.rarity === "خارق" ? "🔥" : c.rarity === "نادر" ? "💎" : "🎴";
            text += `${i+1}. ${emoji} *${c.name}* (${c.rarity}) - قوة: ${c.power}\n`;
            if (c.abilities && c.abilities.length > 0) {
                text += `   ⚡ القدرات: ${c.abilities.map(a => `${a.name} (+${a.power})`).join(" | ")}\n`;
            }
            text += `\n`;
        });
        
        await sock.sendMessage(from, { text, mentions: [target] }, { quoted: msg });
    }
};
