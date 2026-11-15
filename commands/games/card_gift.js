const { loadDB, saveDB } = require('../../handlers/cardsDB');

module.exports = {
    name: "هدية",
    groupOnly: true,
    async execute({ sock, msg, from, sender, args }) {
        const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length === 0) return sock.sendMessage(from, { text: "❌ اعمل منشن للشخص واكتب اسم البطاقة." });
        
        const target = mentions[0];
        if (target === sender) return sock.sendMessage(from, { text: "❌ متقدرش تهدي نفسك." });
        
        const cardName = args.slice(1).join(" ");
        if (!cardName) return sock.sendMessage(from, { text: "❌ اكتب اسم البطاقة بعد المنشن." });
        
        const db = loadDB();
        const user = db[sender] || { cards: [] };
        if (!user.cards) user.cards = [];
        
        const cardIndex = user.cards.findIndex(c => c.name === cardName);
        if (cardIndex === -1) return sock.sendMessage(from, { text: "❌ مفيش البطاقة دي في حقيبتك." });
        
        const card = user.cards.splice(cardIndex, 1)[0];
        const targetUser = db[target] || { points: 0, cards: [] };
        if (!targetUser.cards) targetUser.cards = [];
        
        targetUser.cards.push(card);
        db[sender] = user;
        db[target] = targetUser;
        saveDB(db);
        
        await sock.sendMessage(from, {
            text: `🎁 *هدية!*\n\n@${sender.split('@')[0]} أهدى بطاقة *${card.name}* لـ @${target.split('@')[0]}!`,
            mentions: [sender, target]
        }, { quoted: msg });
    }
};
