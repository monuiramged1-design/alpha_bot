const { loadDB, saveDB } = require('../../handlers/cardsDB');

module.exports = {
    name: "تحويل",
    aliases: ["نقاط", "تحويل_نقاط"],
    groupOnly: true,
    async execute({ sock, msg, from, sender, args }) {
        const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length === 0) return sock.sendMessage(from, { text: "❌ لازم تعمل منشن للشخص اللي عايز تحوله نقاط." }, { quoted: msg });
        
        const target = mentions[0];
        if (target === sender) return sock.sendMessage(from, { text: "❌ بتحول لنفسك؟ 😂" });

        const amountStr = args.find(arg => !isNaN(arg) && !arg.includes('@'));
        const amount = parseInt(amountStr);

        if (!amount || amount <= 0) {
            return sock.sendMessage(from, { text: "❌ اكتب رقم التحويل (المبلغ) بشكل صحيح. مثال: .تحويل 50 @عمر" }, { quoted: msg });
        }

        const db = loadDB();
        const user1 = db[sender] || { points: 0 }; 
        const user2 = db[target] || { points: 0, cards: [] }; 

        // 🌟 التعديل الجديد: منع التحويل لو الرصيد صفر أو بالسالب (مديون)
        if ((user1.points || 0) <= 0) {
            let replyText = (user1.points < 0) 
                ? `❌ إنت مديون بـ *${Math.abs(user1.points)} نقطة*! لازم تسدد ديونك الأول عشان تقدر تحول.` 
                : `❌ رصيدك صفر! لازم تكسب نقاط الأول عشان تقدر تحول.`;
            return sock.sendMessage(from, { text: replyText }, { quoted: msg });
        }

        // التأكد إن معاك نقاط تكفي المبلغ اللي بتكتبه
        if ((user1.points || 0) < amount) {
            return sock.sendMessage(from, { 
                text: `❌ مش معاك نقاط كفاية!\n💰 نقاطك الحالية: *${user1.points || 0}*` 
            }, { quoted: msg });
        }

        // الخصم والإضافة
        user1.points -= amount;
        user2.points = (user2.points || 0) + amount;

        db[sender] = user1;
        db[target] = user2;
        saveDB(db);

        await sock.sendMessage(from, {
            text: `💸 *تم التحويل بنجاح!*\n\n@${sender.split('@')[0]} حول *${amount} نقطة* إلى @${target.split('@')[0]}.\n\n💰 رصيدك الجديد: *${user1.points}*\n💰 رصيده الجديد: *${user2.points}*`,
            mentions: [sender, target]
        }, { quoted: msg });
    }
};
