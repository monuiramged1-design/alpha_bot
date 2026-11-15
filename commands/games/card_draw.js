const { loadDB, saveDB } = require('../../handlers/cardsDB');

const cardsPool = [
    // 🔮 ميثك
    { name: "سايتاما", rarity: "ميثك", minP: 400, maxP: 500 },
    { name: "غوكو", rarity: "ميثك", minP: 380, maxP: 480 },
    { name: "يوهابغ", rarity: "ميثك", minP: 380, maxP: 480 },
    { name: "أيزن", rarity: "ميثك", minP: 350, maxP: 450 },
    { name: "غوجو", rarity: "ميثك", minP: 350, maxP: 450 },
    { name: "سوكونا", rarity: "ميثك", minP: 340, maxP: 440 },
    { name: "مادارا", rarity: "ميثك", minP: 330, maxP: 430 },
    // 🌟 أسطوري
    { name: "ناروتو", rarity: "أسطوري", minP: 250, maxP: 320 },
    { name: "ساسكي", rarity: "أسطوري", minP: 250, maxP: 320 },
    { name: "إيتشيغو", rarity: "أسطوري", minP: 260, maxP: 330 },
    { name: "فيجيتا", rarity: "أسطوري", minP: 260, maxP: 330 },
    { name: "لوفي", rarity: "أسطوري", minP: 240, maxP: 310 },
    { name: "بروتو", rarity: "أسطوري", minP: 230, maxP: 300 },
    { name: "يامي", rarity: "أسطوري", minP: 220, maxP: 290 },
    // 🔥 خارق
    { name: "إرين", rarity: "خارق", minP: 150, maxP: 200 },
    { name: "زورو", rarity: "خارق", minP: 160, maxP: 210 },
    { name: "كيلوا", rarity: "خارق", minP: 140, maxP: 190 },
    { name: "كانيكي", rarity: "خارق", minP: 140, maxP: 190 },
    { name: "تودوروكي", rarity: "خارق", minP: 130, maxP: 180 },
    { name: "ميغومي", rarity: "خارق", minP: 130, maxP: 180 },
    { name: "ليفاي", rarity: "خارق", minP: 120, maxP: 170 },
    // 💎 نادر
    { name: "كاكاشي", rarity: "نادر", minP: 80, maxP: 110 },
    { name: "ميكاسا", rarity: "نادر", minP: 70, maxP: 100 },
    { name: "نيزوكو", rarity: "نادر", minP: 70, maxP: 100 },
    { name: "إينوسكي", rarity: "نادر", minP: 70, maxP: 100 },
    { name: "زينيتسو", rarity: "نادر", minP: 75, maxP: 105 },
    { name: "تانجيرو", rarity: "نادر", minP: 80, maxP: 110 },
    { name: "إدوارد", rarity: "نادر", minP: 65, maxP: 95 },
    // 🎴 عادي
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

function getCardEmoji(rarity) {
    if (rarity === "ميثك") return "🔮";
    if (rarity === "أسطوري") return "🌟";
    if (rarity === "خارق") return "🔥";
    if (rarity === "نادر") return "💎";
    return "🎴";
}

function getPointsForRarity(rarity) {
    if (rarity === "ميثك") return 100;
    if (rarity === "أسطوري") return 50;
    if (rarity === "خارق") return 20;
    if (rarity === "نادر") return 10;
    return 5;
}

module.exports = {
    name: "سحب",
    async execute({ sock, msg, from, sender, args }) {
        if (args && args.length > 0) {
            const subCmd = args[0];
            if (subCmd === "قدرة" || subCmd === "قدرات" || subCmd === "قدره") {
                const db = loadDB();
                const user = db[sender] || { points: 0, cards: [], abilityInventory: [] };
                
                const now = Date.now();
                const cooldown = 2 * 60 * 60 * 1000; 
                const maxDraws = 2;

                if (!user.lastAbilityReset) user.lastAbilityReset = now;
                if (!user.abilityDrawCount) user.abilityDrawCount = 0;

                if (now - user.lastAbilityReset >= cooldown) {
                    user.abilityDrawCount = 0;
                    user.lastAbilityReset = now;
                }

                if (user.abilityDrawCount >= maxDraws) {
                    const hours = Math.floor((cooldown - (now - user.lastAbilityReset)) / (1000 * 60 * 60));
                    const mins = Math.floor(((cooldown - (now - user.lastAbilityReset)) % (1000 * 60 * 60)) / (1000 * 60));
                    return sock.sendMessage(from, { text: `⏳ استنى ${hours} ساعة و ${mins} دقيقة عشان تسحب قدرات تاني.` }, { quoted: msg });
                }

                const abilitiesPool = require('./abilities_pool.json');
                let rand = Math.random() * 100;
                let rarity = "عادي";
                if (rand < 1) rarity = "ميثك";
                else if (rand < 5) rarity = "أسطوري";
                else if (rand < 20) rarity = "خارق";
                else if (rand < 50) rarity = "نادر";
                
                const filtered = abilitiesPool.filter(a => a.rarity === rarity);
                const newAbility = filtered[Math.floor(Math.random() * filtered.length)];

                if (!user.abilityInventory) user.abilityInventory = [];
                user.abilityInventory.push(newAbility);
                
                user.abilityDrawCount++;
                db[sender] = user;
                saveDB(db);

                let emoji = newAbility.rarity === "ميثك" ? "🔮" : newAbility.rarity === "أسطوري" ? "🌟" : newAbility.rarity === "خارق" ? "🔥" : newAbility.rarity === "نادر" ? "💎" : "🎴";

                let extraText = user.abilityDrawCount === 1 ? "تقدر تسحب قدرة تانية دلوقتي لو حبيت!" : "دي كانت آخر قدرة ليك دلوقتي، استنى ساعتين عشان تسحب تاني.";

                return sock.sendMessage(from, { 
                    text: `🎉 *مبروك يا @${sender.split('@')[0]}!*\n\nلقد سحبت قدرة:\n${emoji} *${newAbility.name}*\n🌟 التصنيف: *${newAbility.rarity}*\n⚡ القوة: *+${newAbility.power}*\n\n(محاولة ${user.abilityDrawCount} من 2)\n${extraText}`,
                    mentions: [sender]
                }, { quoted: msg });
            }
        }

        const db = loadDB();
        const user = db[sender] || { points: 0, lastDraw: 0, cards: [] };
        
        const now = Date.now();
        const cooldown = 2 * 60 * 60 * 1000; 
        
        if (now - (user.lastDraw || 0) < cooldown) {
            const hours = Math.floor((cooldown - (now - (user.lastDraw || 0))) / (1000 * 60 * 60));
            const mins = Math.floor(((cooldown - (now - (user.lastDraw || 0))) % (1000 * 60 * 60)) / (1000 * 60));
            return sock.sendMessage(from, { text: `⏳ استنى ${hours} ساعة و ${mins} دقيقة عشان تسحب تاني.` }, { quoted: msg });
        }
        
        const card1 = getRandomCard();
        
        if (!user.cards) user.cards = [];
        user.cards.push(card1);
        user.lastDraw = now;
        if (!user.points) user.points = 0;

        const pts1 = getPointsForRarity(card1.rarity);
        user.points += pts1;
        
        db[sender] = user;
        saveDB(db);

        const emoji1 = getCardEmoji(card1.rarity);

        await sock.sendMessage(from, {
            text: `🎉 *مبروك يا @${sender.split('@')[0]}!*\n\nلقد سحبت بطاقة:\n\n1️⃣ ${emoji1} *${card1.name}*\n🌟 الرتبة: *${card1.rarity}*\n⚔️ القوة: *${card1.power}*\n💰 نقاط إضافية: +${pts1}\n\n📊 *إجمالي نقاطك الآن:* ${user.points}`,
            mentions: [sender]
        }, { quoted: msg });
    }
};
