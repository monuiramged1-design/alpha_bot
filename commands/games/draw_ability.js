const { loadDB, saveDB } = require('../../handlers/cardsDB');

const abilitiesPool = [
    { name: "راسينجان (Naruto)", power: 20 },
    { name: "جير 5 (One Piece)", power: 50 },
    { name: "دومين إكسبانشن (JJK)", power: 60 },
    { name: "كاميهاميها (Dragon Ball)", power: 30 },
    { name: "بانكاي (Bleach)", power: 40 },
    { name: "شaringan (Naruto)", power: 15 },
    { name: "لوفينج (One Piece)", power: 45 },
    { name: "شيكي (JJK)", power: 35 },
    { name: "هيرو ستايل (My Hero)", power: 10 },
    { name: "تنفس الشمس (Demon Slayer)", power: 25 },
    { name: "ألترا إنستنكت (DB)", power: 55 },
    { name: "ميرا ميرا نو مي (One Piece)", power: 20 }
];

module.exports = {
    name: "سحب_قدرة",
    aliases: ["سحب_قدرات"],
    async execute({ sock, msg, from, sender }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, cards: [], abilityInventory: [], lastAbilityDraw: 0 };
        
        const now = Date.now();
        const cooldown = 5 * 60 * 60 * 1000; // 5 ساعات
        
        if (now - (user.lastAbilityDraw || 0) < cooldown) {
            const hours = Math.floor((cooldown - (now - (user.lastAbilityDraw || 0))) / (1000 * 60 * 60));
            const mins = Math.floor(((cooldown - (now - (user.lastAbilityDraw || 0))) % (1000 * 60 * 60)) / (1000 * 60));
            return sock.sendMessage(from, { text: `⏳ استنى ${hours} ساعة و ${mins} دقيقة عشان تسحب قدرة تانية.` }, { quoted: msg });
        }

        const newAbility = abilitiesPool[Math.floor(Math.random() * abilitiesPool.length)];
        if (!user.abilityInventory) user.abilityInventory = [];
        
        user.abilityInventory.push(newAbility);
        user.lastAbilityDraw = now;
        db[sender] = user;
        saveDB(db);

        await sock.sendMessage(from, { 
            text: `🎉 *مبروك يا @${sender.split('@')[0]}!*\n\nلقد سحبت قدرة:\n⚡ *${newAbility.name}* (+${newAbility.power} قوة)\n\nالقدرة دلوقتي في شنطة القدرات بتاعتك.\nعشان تحطها على بطاقة، اكتب:\n*.تطبيق_قدرة [اسم البطاقة]*`,
            mentions: [sender]
        }, { quoted: msg });
    }
};
