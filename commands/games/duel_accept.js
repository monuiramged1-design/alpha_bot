const { loadDB, saveDB } = require('../../handlers/cardsDB');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: "قبول",
    aliases: ["رفض", "موافق"],
    groupOnly: true,
    async execute({ sock, msg, from, sender, raw }) {
        const isAccept = raw.startsWith(".قبول") || raw.startsWith(".موافق");
        
        let targetJid = sender;
        let targetLid = sender;
        let targetName = msg.pushName || "الخصم";

        try {
            const meta = await sock.groupMetadata(from);
            const pTarget = meta.participants.find(x => x.lid === sender || x.id === sender);
            if (pTarget) {
                targetName = pTarget.notify || pTarget.name || targetName;
                if (pTarget.id) targetJid = pTarget.id;
                if (pTarget.lid) targetLid = pTarget.lid;
            }
        } catch (e) {}

        let foundDuel = null;
        let duelId = null;
        
        for (const [id, data] of global.pendingDuels.entries()) {
            if (data.group === from && (data.target === targetJid || data.targetLid === targetLid || data.target === sender)) {
                foundDuel = data;
                duelId = id;
                break;
            }
        }
        
        if (!foundDuel) return sock.sendMessage(from, { text: "❌ مفيش حد متحديك في مبارزة دلوقتي." });
        
        clearTimeout(foundDuel.timeoutId);
        global.pendingDuels.delete(duelId);
        
        const challengerJid = foundDuel.challenger;
        const challengerName = foundDuel.challengerName || "المتحدي";
        
        if (!isAccept) {
            return sock.sendMessage(from, {
                text: `🏳️ *${targetName}* انسحب من المعركة! يبدو إنه خاف من *${challengerName}* 😂`,
                mentions: [targetJid, challengerJid]
            }, { quoted: msg });
        }
        
        const db = loadDB();
        const user1 = db[challengerJid];
        const user2 = db[targetJid];
        
        if (!user1 || !user1.cards || user1.cards.length === 0 || !user2 || !user2.cards || user2.cards.length === 0) {
            return sock.sendMessage(from, { text: "❌ واحد منكم باع أو فقد بطاقاته." });
        }

        let p1Base = 0, p1AbilityPower = 0, p1BestAbility = null, p1BestCard = null;
        user1.cards.forEach(c => {
            if (!p1BestCard || c.power > p1BestCard.power) p1BestCard = c;
            let cardAbilitiesPower = 0;
            if (c.abilities) c.abilities.forEach(a => { 
                cardAbilitiesPower += a.power; 
                if (!p1BestAbility || a.power > p1BestAbility.power) p1BestAbility = a; 
            });
            p1Base += (c.power - cardAbilitiesPower); p1AbilityPower += cardAbilitiesPower;
        });

        let p2Base = 0, p2AbilityPower = 0, p2BestAbility = null, p2BestCard = null;
        user2.cards.forEach(c => {
            if (!p2BestCard || c.power > p2BestCard.power) p2BestCard = c;
            let cardAbilitiesPower = 0;
            if (c.abilities) c.abilities.forEach(a => { 
                cardAbilitiesPower += a.power; 
                if (!p2BestAbility || a.power > p2BestAbility.power) p2BestAbility = a; 
            });
            p2Base += (c.power - cardAbilitiesPower); p2AbilityPower += cardAbilitiesPower;
        });

        const card1Name = p1BestCard ? p1BestCard.name : "مقاتل مجهول";
        const card2Name = p2BestCard ? p2BestCard.name : "مقاتل مجهول";
        const ab1Name = p1BestAbility ? p1BestAbility.name : "ضربة عادية";
        const ab2Name = p2BestAbility ? p2BestAbility.name : "دفاع عادي";

        const luck1 = 0.8 + Math.random() * 0.4;
        const luck2 = 0.8 + Math.random() * 0.4;
        const crit1 = Math.random() < 0.15 ? 1.5 : 1;
        const crit2 = Math.random() < 0.15 ? 1.5 : 1;
        
        const finalP1 = (p1Base * luck1 * crit1) + (p1AbilityPower * 2.5);
        const finalP2 = (p2Base * luck2 * crit2) + (p2AbilityPower * 2.5);
        
        await sock.sendMessage(from, { 
            text: `⚔️ *حلبة المعركة!* ⚔️\n\n*${card1Name}* (مع ${challengerName}) يقف في مواجهة *${card2Name}* (مع ${targetName})!\n\nمين هيسقط الأول؟ 😱`,
            mentions: [challengerJid, targetJid]
        });
        
        await sleep(2500);

        let critText1 = crit1 > 1 ? " بضربة قاضية خارقة للعادة!" : "";
        await sock.sendMessage(from, { 
            text: `💥 *${card1Name}* يستجمع طاقته ويهاجم بـ *${ab1Name}*${critText1}`
        });
        
        await sleep(2500);

        let critText2 = crit2 > 1 ? " وبضربة معاكسة مدمرة!" : " لصد الهجوم!";
        await sock.sendMessage(from, { 
            text: `🛡️ *${card2Name}* يتصدى بكل قوته ويتفعل *${ab2Name}*${critText2}`
        });

        await sleep(2500);

        let winnerId, winText, actionText, winnerName, loserName;
        if (finalP1 > finalP2) {
            winnerId = challengerJid; winnerName = challengerName; loserName = targetName;
            actionText = `بفضل قوة *${ab1Name}*، تمكن *${card1Name}* من اختراق دفاعات *${card2Name}* وضرب الضربة الحاسمة!`;
            winText = `🏆 *الفائز:* ${winnerName} (القوة: ${Math.round(finalP1)})\n💔 *الخاسر:* ${loserName} (القوة: ${Math.round(finalP2)})`;
        } else {
            winnerId = targetJid; winnerName = targetName; loserName = challengerName;
            actionText = `بفضل قوة *${ab2Name}*، قلب *${card2Name}* الطاولة على *${card1Name}* وحقق فوزاً ساحقاً!`;
            winText = `🏆 *الفائز:* ${winnerName} (القوة: ${Math.round(finalP2)})\n💔 *الخاسر:* ${loserName} (القوة: ${Math.round(finalP1)})`;
        }
        
        const pointsSteal = 50;
        user1.points = user1.points || 0; user2.points = user2.points || 0;
        
        if (winnerId === challengerJid) { user1.points += pointsSteal; user2.points = Math.max(0, user2.points - pointsSteal); }
        else { user2.points += pointsSteal; user1.points = Math.max(0, user1.points - pointsSteal); }
        
        db[challengerJid] = user1; db[targetJid] = user2; saveDB(db);
        
        await sock.sendMessage(from, {
            text: `🏁 *نهاية المعركة!*\n\n${winText}\n\n${actionText}\n\n💰 *تم سلب ${pointsSteal} نقطة من الخاسر!*`,
            mentions: [challengerJid, targetJid, winnerId]
        });
    }
};
