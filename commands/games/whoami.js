const config = require("../../config.json");

module.exports = {
  name: "whoami",
  async execute({ sock, msg, from, sender, isGroup }) {
    let targetJid = sender;
    let targetName = msg.pushName || "مجهول";
    
    // 1. لو فيه منشن، ناخد الشخص اللي معمول له منشن
    const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentions.length > 0) {
        targetJid = mentions[0];
        try {
            const meta = await sock.groupMetadata(from);
            const p = meta.participants.find(x => x.id === targetJid);
            targetName = p?.notify || p?.name || "عضو غير معروف";
        } catch(e) {
            targetName = "عضو غير معروف";
        }
    }

    // 2. نحدد الرتبة
    let role = "عضو عادي";
    if (isGroup) {
      const isAdmin = await global.checkAdmin(sock, from, targetJid);
      if (isAdmin) role = "مشرف 👑";
    }
    
    const targetNum = targetJid.split("@")[0];
    const nameLower = targetName.toLowerCase();

    // 🌟 الأولوية للأرقام المخصصة زي ما إنت طلبت
    if (targetNum === "248760596746433") {
        role = "مؤسس 👑🛡️";
    } 
    else if (targetNum === "171829108969509") {
        role = "الملك 👑";
    } 
    else if (targetNum === "126023500857484") {
        role = "نائبة ملك 👑";
    } 
    // 🌟 التعديل الجديد: لو الاسم فيه جيو أو geo يبقى Rank
    else if (nameLower.includes("جيو") || nameLower.includes("geo") || nameLower.includes("ghio")) {
        role = "Rank ⚜️";
    }
    // باقي الأونرز
    else if (config.ownerNumbers && config.ownerNumbers.includes(targetNum)) {
        role = "المطور/الأونر 👑🔥";
    }
    
    // 3. نرسل الرسالة
    const isMention = mentions.length > 0;
    await sock.sendMessage(from, { 
      text: `${isMention ? "🪪 *معلومات الشخص:*" : "🪪 *معلوماتك:*"}\n\n👤 الاسم: ${targetName}\n🆔 الآي دي: ${targetNum}\n🎖️ رتبته: ${role}`,
      mentions: [targetJid]
    }, { quoted: msg });
  },

  // ميزة الهاشتاج
  async onMessage({ sock, msg, from, text, sender, isGroup }) {
    if (!isGroup) return false;
    if (!text.startsWith("#")) return false;

    const senderNumber = sender.split("@")[0];
    if (!config.ownerNumbers.includes(senderNumber)) return false;

    const targetName = text.slice(1).trim(); 
    if (!targetName) return false;

    let targetJid = null;
    let targetPushName = targetName;

    const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentions.length > 0) {
        targetJid = mentions[0];
    } else {
        try {
            const meta = await sock.groupMetadata(from);
            const participant = meta.participants.find(p => 
                p.id.includes(targetName) || 
                (p.notify && p.notify.toLowerCase().includes(targetName.toLowerCase())) ||
                (p.name && p.name.toLowerCase().includes(targetName.toLowerCase()))
            );
            if (participant) {
                targetJid = participant.id;
                targetPushName = participant.notify || participant.name || targetName;
            }
        } catch(e) {}
    }

    if (targetJid) {
        let role = "عضو عادي";
        try {
            const meta = await sock.groupMetadata(from);
            const p = meta.participants.find(x => x.id === targetJid);
            if (p?.admin === "admin" || p?.admin === "superadmin") role = "مشرف 👑";
        } catch(e) {}

        const targetNum = targetJid.split("@")[0];
        const nameLower = targetPushName.toLowerCase();

        // نفس الترتيب هنا للهاشتاج
        if (targetNum === "248760596746433") {
            role = "مؤسس 👑🛡️";
        } else if (targetNum === "171829108969509") {
            role = "الملك 👑";
        } else if (targetNum === "126023500857484") {
            role = "نائبة ملك 👑";
        } else if (nameLower.includes("جيو") || nameLower.includes("geo") || nameLower.includes("ghio")) {
            role = "Rank ⚜️";
        } else if (config.ownerNumbers.includes(targetNum)) {
            role = "المطور/الأونر 👑🔥";
        }

        await sock.sendMessage(from, {
            text: `🪪 *معلومات الشخص:*\n\n👤 الاسم: ${targetPushName}\n🆔 الآي دي: ${targetNum}\n🎖️ رتبته: ${role}`,
            mentions: [targetJid]
        }, { quoted: msg });
        return true;
    } else {
        await sock.sendMessage(from, { text: `❌ مفيش عضو بالاسم *${targetName}* في الجروب، أو محتاج تعمله منشن.` }, { quoted: msg });
        return true;
    }
  }
};
