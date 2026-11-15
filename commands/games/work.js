const { loadDB, saveDB } = require('../../handlers/cardsDB');

const jobs = [
    "اشتغلت في مزرعة أنمي وجمعت تفاح", "اشتغلت صياد في ون بيس", "ساعدت كاكاشي في مهمة", 
    "حاربت مع قراصنة قبعة القش", "اشتغلت في مقهى جوجوتسو", "بعت بطاطا في قرية الورق",
    "عملت توصيل طلبات لشركة الأكاتسكي", "خضت تدريب شاق مع روك لي", "اشتغلت حارس شخصي للملك غيو"
];

module.exports = {
    name: "عمل",
    async execute({ sock, msg, from, sender }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, lastWork: 0, cards: [] };
        
        const now = Date.now();
        const cooldown = 60 * 60 * 1000; // ساعة
        
        if (now - (user.lastWork || 0) < cooldown) {
            const mins = Math.ceil((cooldown - (now - (user.lastWork || 0))) / (1000 * 60));
            return sock.sendMessage(from, { text: `⏳ إنت تعبان ومش قادر تشتغل دلوقتي. استنى ${mins} دقيقة.` }, { quoted: msg });
        }
        
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const pointsEarned = Math.floor(Math.random() * 81) + 20; // من 20 لـ 100
        
        if (!user.points) user.points = 0;
        user.points += pointsEarned;
        user.lastWork = now;
        
        db[sender] = user;
        saveDB(db);
        
        await sock.sendMessage(from, {
            text: `💼 *خلصت شغلك النهاردة!*\n\n${job}.\n\n💵 كسبت: *+${pointsEarned} نقطة*\n📊 إجمالي نقاطك: *${user.points}*`,
            mentions: [sender]
        }, { quoted: msg });
    }
};
