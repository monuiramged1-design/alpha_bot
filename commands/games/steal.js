const { loadDB, saveDB } = require('../../handlers/cardsDB');

module.exports = {
    name: "سرقة",
    groupOnly: true,
    async execute({ sock, msg, from, sender }) {
        const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length === 0) return sock.sendMessage(from, { text: "❌ اعمل منشن للشخص اللي عايز تسرقه." }, { quoted: msg });
        
        const target = mentions[0];
        if (target === sender) return sock.sendMessage(from, { text: "❌ بتحاول تسرق نفسك؟ 😂" });
        
        const db = loadDB();
        const user1 = db[sender] || { points: 0 }; // الحرامي
        const user2 = db[target] || { points: 0 }; // الضحية
        
        if ((user2.points || 0) < 10) {
            return sock.sendMessage(from, { text: `❌ @${target.split('@')[0]} مفلس ومفيش عنده حاجة تتسرق.` }, { mentions: [target] });
        }

        // 🌟 نظام الحد من السرقة (3 محاولات عامة كل 3 ساعات)
        if (!user1.stealHistoryOverall) user1.stealHistoryOverall = [];

        const now = Date.now();
        const threeHoursAgo = now - (3 * 60 * 60 * 1000); 
        
        // بنشيل المحاولات القديمة اللي بقالها أكتر من 3 ساعات
        user1.stealHistoryOverall = user1.stealHistoryOverall.filter(time => time > threeHoursAgo);

        // لو حاول 3 مرات أو أكتر في أي مكان
        if (user1.stealHistoryOverall.length >= 3) {
            return sock.sendMessage(from, { 
                text: `🚨 *ممنوع!*\n\nإنت حاولت تسرق 3 مرات في آخر 3 ساعات!\nسيبت حالك بقى واستنى شوية عشان تقدر تسرق حد تاني. 😂`, 
                mentions: [sender] 
            });
        }

        // تسجيل المحاولة الجديدة
        user1.stealHistoryOverall.push(now);
        const attemptNum = user1.stealHistoryOverall.length;

        // نسبة النجاح 25%
        const isSuccess = Math.random() < 0.25; 
        
        if (isSuccess) {
            let stolen = Math.floor(Math.random() * 91) + 10; 
            if (stolen > user2.points) stolen = user2.points; 
            
            user1.points = (user1.points || 0) + stolen;
            user2.points -= stolen;
            
            db[sender] = user1;
            db[target] = user2;
            saveDB(db);
            
            await sock.sendMessage(from, {
                text: `🕵️‍♂️ *سرقة ناجحة!*\n\n@${sender.split('@')[0]} نجح في سرقة *${stolen} نقطة* من @${target.split('@')[0]}! 💰\n\n*(محاولة ${attemptNum}/3 في آخر 3 ساعات)*`,
                mentions: [sender, target]
            }, { quoted: msg });
        } else {
            // نظام المديونية
            let penalty = Math.floor(Math.random() * 91) + 10;
            
            user1.points = (user1.points || 0) - penalty;
            user2.points = (user2.points || 0) + penalty;
            
            db[sender] = user1;
            db[target] = user2;
            saveDB(db);
            
            let debtText = "";
            if (user1.points < 0) {
                debtText = `\n💳 *إنت بقت مديون بـ ${Math.abs(user1.points)} نقطة!*`;
            }

            await sock.sendMessage(from, {
                text: `🚨 *فشلت السرقة!*\n\nالبوت مسك @${sender.split('@')[0]} وهو بيحاول يسرق @${target.split('@')[0]}!\n\n💸 اتغرم بـ *${penalty} نقطة* واتحولوا للضحية. 😂${debtText}\n\n*(محاولة ${attemptNum}/3 في آخر 3 ساعات)*`,
                mentions: [sender, target]
            }, { quoted: msg });
        }
    }
};
