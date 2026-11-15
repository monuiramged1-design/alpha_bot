module.exports = {
  name: "events", 
  aliases: ["event", "dillevents", "eventsall", "dillevntsall"],
  async execute({ sock, msg, from, raw }) {
    const isAll = raw.includes("all");
    
    if (isAll) {
        let text = "📅 *سجل الفعاليات في كل الجروبات:*\n\n";
        let hasEvents = false;
        for (const groupId in global.eventsData) {
            if (global.eventsData[groupId].length > 0) {
                hasEvents = true;
                text += `👥 *جروب:* ${groupId.split("@")[0]}\n`;
                global.eventsData[groupId].slice(-5).forEach(e => { 
                    text += `- ${e.game} 🏆 الفائز: @${e.winner}\n  (${e.date})\n`;
                });
                text += "\n";
            }
        }
        if (!hasEvents) text += "❌ لا توجد فعاليات مسجلة حالياً.";
        await sock.sendMessage(from, { text });
    } else {
        const groupEvents = global.eventsData[from] || [];
        if (groupEvents.length === 0) {
            return sock.sendMessage(from, { text: "📅 *أحداث الجروب:*\n\n❌ لا توجد فعاليات مسجلة في هذا الجروب حتى الآن." }, { quoted: msg });
        }
        
        let text = "📅 *سجل فعاليات الجروب:*\n\n";
        groupEvents.slice(-10).forEach(e => { 
            text += `🎮 ${e.game}\n👑 الفائز: @${e.winner}\n📅 التاريخ: ${e.date}\n\n`;
        });
        
        await sock.sendMessage(from, { text, mentions: groupEvents.map(e => e.winnerId) });
    }
  }
};
