const { loadDB, saveDB } = require('../../handlers/cardsDB');

module.exports = {
    name: "جمع",
    async execute({ sock, msg, from, sender }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, lastCollect: 0 };
        
        const now = Date.now();
        // 🌟 التعديل هنا: الوقت رجع 30 دقيقة
        const cooldown = 30 * 60 * 1000; 
        
        if (now - (user.lastCollect || 0) < cooldown) {
            const mins = Math.ceil((cooldown - (now - (user.lastCollect || 0))) / (1000 * 60));
            return sock.sendMessage(from, { text: `⏳ استنى ${mins} دقيقة عشان تقدر تجمع تاني.` }, { quoted: msg });
        }
        
        const places = [
            "لقيت محفظة قديمة في الشارع", "لقيت صندوق كنز مدفون في قرية الورق", 
            "شوفت فلوس واقعية في مقهى جوجوتسو", "الاقى لك مكافأة من الملك غيو", 
            "لقيت شنطة مليانة في مخبأ الأكاتسكي", "لقيت نقاط في جيب كاكاشي"
        ];
        
        const place = places[Math.floor(Math.random() * places.length)];
        const pointsEarned = Math.floor(Math.random() * 36) + 15; // من 15 لـ 50
        
        if (!user.points) user.points = 0;
        user.points += pointsEarned;
        user.lastCollect = now;
        
        db[sender] = user;
        saveDB(db);
        
        await sock.sendMessage(from, {
            text: `💼 *عملية جمع ناجحة!*\n\n${place}.\n\n💵 كسبت: *+${pointsEarned} نقطة*\n📊 إجمالي نقاطك: *${user.points}*`,
            mentions: [sender]
        }, { quoted: msg });
    }
};
