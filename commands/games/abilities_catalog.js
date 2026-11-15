const abilitiesPool = [
    { name: "زينو إنستنكت (DB)", rarity: "ميثك", power: 95 },
    { name: "عين الشينيجامي (Death Note)", rarity: "ميثك", power: 90 },
    { name: "لولوش جياس (Code Geass)", rarity: "ميثك", power: 85 },
    { name: "رينيجان (Naruto)", rarity: "ميثك", power: 80 },
    { name: "جير 5 (One Piece)", rarity: "ميثك", power: 75 },
    { name: "دومين إكسبانشن (JJK)", rarity: "ميثك", power: 70 },
    { name: "ألترا إنستنكت (DB)", rarity: "ميثك", power: 65 },
    { name: "إعادة إحياء (7DS)", rarity: "أسطوري", power: 60 },
    { name: "بانكاي (Bleach)", rarity: "أسطوري", power: 58 },
    { name: "هاكي الملك (One Piece)", rarity: "أسطوري", power: 55 },
    { name: "ماكاما (Soul Eater)", rarity: "أسطوري", power: 52 },
    { name: "شيبودن راسينجان (Naruto)", rarity: "أسطوري", power: 50 },
    { name: "تنفس القمر (Demon Slayer)", rarity: "أسطوري", power: 48 },
    { name: "لوفينج (One Piece)", rarity: "أسطوري", power: 46 },
    { name: "سيلز جيت (DB)", rarity: "خارق", power: 45 },
    { name: "كاميهاميها (DB)", rarity: "خارق", power: 44 },
    { name: "بلاك هول (Bleach)", rarity: "خارق", power: 42 },
    { name: "بلاك فايزر (My Hero)", rarity: "خارق", power: 40 },
    { name: "ماجيك إمبراطور (Fairy Tail)", rarity: "خارق", power: 39 },
    { name: "أوتاما (Gintama)", rarity: "خارق", power: 38 },
    { name: "تنفس الشمس (Demon Slayer)", rarity: "خارق", power: 37 },
    { name: "يامي يامي نو مي (One Piece)", rarity: "خارق", power: 35 },
    { name: "راسينجان (Naruto)", rarity: "خارق", power: 32 },
    { name: "روك لي (البوابات 8)", rarity: "نادر", power: 30 },
    { name: "كاموي (Kakashi)", rarity: "نادر", power: 29 },
    { name: "جيتسو (JJK)", rarity: "نادر", power: 28 },
    { name: "هيسوكا (HxH)", rarity: "نادر", power: 27 },
    { name: "ميرا ميرا نو مي (One Piece)", rarity: "نادر", power: 26 },
    { name: "كيوكن (Demon Slayer)", rarity: "نادر", power: 25 },
    { name: "دايناميت (My Hero)", rarity: "نادر", power: 24 },
    { name: "شيدو (Naruto)", rarity: "نادر", power: 22 },
    { name: "هيرو ستايل (My Hero)", rarity: "نادر", power: 21 },
    { name: "شaringan (Naruto)", rarity: "نادر", power: 20 },
    { name: "بيست تيتان (AOT)", rarity: "عادي", power: 18 },
    { name: "شيدو ريوجو (Naruto)", rarity: "عادي", power: 16 },
    { name: "سوبر سايان (DB)", rarity: "عادي", power: 15 },
    { name: "شوريوكين (Street Fighter)", rarity: "عادي", power: 14 },
    { name: "كاتانا (Demon Slayer)", rarity: "عادي", power: 12 },
    { name: "كوناي (Naruto)", rarity: "عادي", power: 10 },
    { name: "هيميكو (One Piece)", rarity: "عادي", power: 8 },
    { name: "مسدس (Death Note)", rarity: "عادي", power: 5 }
];

module.exports = {
    name: "عرض القدرات",
    aliases: ["قدرات"],
    async execute({ sock, msg, from, args }) {
        const rarityArg = args[0];
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

        await sock.sendMessage(from, { text }, { quoted: msg });
    }
};
