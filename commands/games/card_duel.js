const { loadDB } = require('../../handlers/cardsDB');
global.pendingDuels = global.pendingDuels || new Map();

module.exports = {
    name: "مبارزة",
    groupOnly: true,
    async execute({ sock, msg, from, sender }) {
        const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length === 0) return sock.sendMessage(from, { text: "❌ لازم تعمل منشن للشخص اللي عايز تتحداه." }, { quoted: msg });
        
        let targetMention = mentions[0];
        if (targetMention === sender) return sock.sendMessage(from, { text: "❌ متقدرش تتحدى نفسك." });
        
        let targetJid = targetMention;
        let targetLid = targetMention;
        let targetName = "الخصم";
        
        let senderJid = sender;
        let senderLid = sender;
        let senderName = msg.pushName || "عضو";

        try {
            const meta = await sock.groupMetadata(from);
            
            // جلب بيانات المتحدي
            const pSender = meta.participants.find(x => x.lid === sender || x.id === sender);
            if (pSender) {
                senderName = pSender.notify || pSender.name || senderName;
                if (pSender.id) senderJid = pSender.id;
                if (pSender.lid) senderLid = pSender.lid;
            }

            // جلب بيانات الخصم
            const pTarget = meta.participants.find(x => x.lid === targetMention || x.id === targetMention);
            if (pTarget) {
                targetName = pTarget.notify || pTarget.name || targetName;
                if (pTarget.id) targetJid = pTarget.id;
                if (pTarget.lid) targetLid = pTarget.lid;
            }
        } catch (e) {}

        for (const [key, data] of global.pendingDuels.entries()) {
            if (data.group === from && (
                data.challenger === senderJid || data.challengerLid === senderLid || 
                data.target === targetJid || data.targetLid === targetLid ||
                data.target === senderJid || data.targetLid === senderLid ||
                data.challenger === targetJid || data.challengerLid === targetLid
            )) {
                return sock.sendMessage(from, { text: "⚠️ فيه مبارزة معلقة بالفعل لواحد منكم. استنوا شوية." });
            }
        }

        const db = loadDB();
        const user1 = db[senderJid] || { points: 0, cards: [] };
        const user2 = db[targetJid] || { points: 0, cards: [] };
        
        if (!user1.cards || user1.cards.length === 0) return sock.sendMessage(from, { text: "❌ إنت مفيش عندك بطاقات. اسحب الأول بـ .سحب" });
        if (!user2.cards || user2.cards.length === 0) return sock.sendMessage(from, { text: `❌ ${targetName} مفيش عنده بطاقات.` }, { mentions: [targetJid] });

        const duelId = `${from}_${Date.now()}`;
        
        const timeoutId = setTimeout(() => {
            if (global.pendingDuels.has(duelId)) {
                global.pendingDuels.delete(duelId);
                sock.sendMessage(from, { text: `⏰ انتهى وقت المبارزة بين ${senderName} و ${targetName}.` });
            }
        }, 60000); 

        global.pendingDuels.set(duelId, { 
            challenger: senderJid, 
            challengerLid: senderLid,
            challengerName: senderName,
            target: targetJid, 
            targetLid: targetLid,
            targetName: targetName,
            group: from, 
            timeoutId: timeoutId 
        });

        await sock.sendMessage(from, {
            text: `🔥 *تحدي مبارزة أسطوري!* 🔥\n\n⚔️ المحارب *${senderName}* يوجه نداءً لـ *${targetName}*!\n\nيا ${targetName}، هل تملك الشجاعة لمواجهتي؟\n⏳ عندك 60 ثانية للرد.\n\nاكتب *.قبول* لبدء المعركة أو *.رفض* للانسحاب!`,
            mentions: [senderJid, targetJid]
        }, { quoted: msg });
    }
};
