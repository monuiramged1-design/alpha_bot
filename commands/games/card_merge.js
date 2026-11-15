const { loadDB, saveDB } = require('../../handlers/cardsDB');
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

function getRandomCard() {
    let rand = Math.random() * 100;
    let rarity = "عادي";
    if (rand < 1) rarity = "ميثك";
    else if (rand < 5) rarity = "أسطوري";
    else if (rand < 20) rarity = "خارق";
    else if (rand < 50) rarity = "نادر";
    const filtered = cardsPool.filter(c => c.rarity === rarity);
    const card = filtered[Math.floor(Math.random() * filtered.length)];
    const power = Math.floor(Math.random() * (card.maxP - card.minP + 1)) + card.minP;
    return { name: card.name, rarity: card.rarity, power: power };
}

module.exports = {
    name: "دمج",
    async execute({ sock, msg, from, sender, args }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, cards: [], abilityInventory: [] };
        
        // 🌟 فحص لو المستخدم بيدمج قدرات
        if (args[0] === "قدرة" || args[0] === "قدرات" || args[0] === "قدره") {
            if (!user.abilityInventory || user.abilityInventory.length < 2) {
                return sock.sendMessage(from, { text: "❌ محتاج قدرتين على الأقل في شنطتك عشان تدمجهم." });
            }

            const counts = {};
            user.abilityInventory.forEach(a => { counts[a.name] = (counts[a.name] || 0) + 1; });

            let mergeableName = null;
            for (const name in counts) {
                if (counts[name] >= 2) { mergeableName = name; break; }
            }

            if (!mergeableName) {
                return sock.sendMessage(from, { text: "❌ محتاج قدرتين من نفس النوع بالظبط عشان تدمجهم." });
            }

            const targetAbility = user.abilityInventory.find(a => a.name === mergeableName);
            const currentRarity = targetAbility.rarity;

            // شيل القدرتين
            let removed = 0;
            user.abilityInventory = user.abilityInventory.filter(a => {
                if (a.name === mergeableName && removed < 2) {
                    removed++;
                    return false;
                }
                return true;
            });

            // تحديد الرتبة الجديدة
            let newRarity = "نادر";
            if (currentRarity === "عادي") newRarity = "نادر";
            else if (currentRarity === "نادر") newRarity = "خارق";
            else if (currentRarity === "خارق") newRarity = "أسطوري";
            else if (currentRarity === "أسطوري") newRarity = "ميثك";
            else newRarity = "ميثك"; // لو كان ميثك هيفضل ميثك

            const filtered = abilitiesPool.filter(a => a.rarity === newRarity);
            const newAbility = filtered[Math.floor(Math.random() * filtered.length)];

            user.abilityInventory.push(newAbility);
            db[sender] = user;
            saveDB(db);

            let emoji = newAbility.rarity === "ميثك" ? "🔮" : newAbility.rarity === "أسطوري" ? "🌟" : newAbility.rarity === "خارق" ? "🔥" : newAbility.rarity === "نادر" ? "💎" : "🎴";

            return sock.sendMessage(from, {
                text: `🔄 *تم دمج القدرات بنجاح!*\n\nتم دمج قدرتين من *${mergeableName}*.\n\n🎉 حصلت على قدرة جديدة:\n${emoji} *${newAbility.name}* (${newAbility.rarity})\n⚡ القوة: +${newAbility.power}`,
                mentions: [sender]
            }, { quoted: msg });
        }

        // 🌟 الكود العادي لدمج البطاقات
        if (!user.cards) user.cards = [];
        
        const counts = {};
        user.cards.forEach(c => { counts[c.name] = (counts[c.name] || 0) + 1; });
        
        let mergeableName = null;
        for (const name in counts) {
            if (counts[name] >= 2) { mergeableName = name; break; }
        }
        
        if (!mergeableName) return sock.sendMessage(from, { text: "❌ محتاج بطاقتين من نفس الشخصية عشان تدمجهم." });
        
        let removedCards = [];
        user.cards = user.cards.filter(c => {
            if (c.name === mergeableName && removedCards.length < 2) {
                removedCards.push(c);
                return false;
            }
            return true;
        });
        
        let inheritedAbilities = [];
        removedCards.forEach(c => {
            if (c.abilities) {
                c.abilities.forEach(a => {
                    if (!inheritedAbilities.find(x => x.name === a.name)) {
                        inheritedAbilities.push(a);
                    }
                });
            }
        });

        const newCard = getRandomCard();
        
        if (inheritedAbilities.length > 0) {
            newCard.abilities = inheritedAbilities.slice(0, 2);
            let abilityPower = newCard.abilities.reduce((sum, a) => sum + a.power, 0);
            newCard.power += abilityPower; 
        }

        user.cards.push(newCard);
        db[sender] = user;
        saveDB(db);
        
        let emoji = newCard.rarity === "ميثك" ? "🔮" : newCard.rarity === "أسطوري" ? "🌟" : newCard.rarity === "خارق" ? "🔥" : newCard.rarity === "نادر" ? "💎" : "🎴";

        let abilitiesText = "";
        if (newCard.abilities && newCard.abilities.length > 0) {
            abilitiesText = `\n⚡ القدرات المنقولة: ${newCard.abilities.map(a => `${a.name} (+${a.power})`).join(" | ")}`;
        }

        await sock.sendMessage(from, {
            text: `🔄 *تم الدمج بنجاح!*\n\nتم دمج بطاقتين من *${mergeableName}*.\n\n🎉 حصلت على بطاقة جديدة:\n${emoji} *${newCard.name}* (${newCard.rarity})\n⚔️ القوة الإجمالية: ${newCard.power}${abilitiesText}`,
            mentions: [sender]
        }, { quoted: msg });
    }
};
