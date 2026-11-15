const { loadDB, saveDB } = require('../../handlers/cardsDB');

module.exports = {
    name: "اخفاء",
    aliases: ["اخفاء_البطاقات"],
    async execute({ sock, msg, from, sender }) {
        const db = loadDB();
        const user = db[sender] || { points: 0, cards: [] };

        // تشغيل أو إيقاف الإخفاء
        user.hideCards = !user.hideCards;
        db[sender] = user;
        saveDB(db);

        if (user.hideCards) {
            await sock.sendMessage(from, { 
                text: `🤫 *تم إخفاء بطاقاتك بنجاح!*\n\nأي حد هيحاول يفتح حقيبتك بـ .عرض @إنت، مش هيقدر يشوف حاجة.`,
                mentions: [sender]
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: `👁️ *تم إظهار بطاقاتك للجميع!*\n\nالكل دلوقتي يقدر يشوف حقيبتك.`,
                mentions: [sender]
            }, { quoted: msg });
        }
    }
};
