const c = [["مصر", "القاهرة"], ["السعودية", "الرياض"], ["فرنسا", "باريس"], ["اليابان", "طوكيو"], ["البرازيل", "برازيليا"], ["كندا", "أوتاوا"], ["أستراليا", "كانبرا"], ["تركيا", "أنقرة"], ["المغرب", "الرباط"], ["الجزائر", "الجزائر"]]; 
const active = new Map();
global.gameHints = global.gameHints || {};

module.exports = { 
  name: "عواصم", 
  async execute({ sock, msg, from }) { 
    const [country, capital] = c[Math.floor(Math.random()*c.length)]; 
    active.set(from, capital); 
    global.gameHints[from] = `العاصمة تبدأ بحرف (${capital.charAt(0)}).`;
    await sock.sendMessage(from, { text: `🌍 عاصمة *${country}* هي؟\n(اكتب .تلميح لو محتاج مساعدة)` }, { quoted: msg }); 
  }, 
  async onMessage({ sock, msg, from, text, sender }) { 
    const cap = active.get(from); 
    if (!cap) return false; 
    if (text.trim().toLowerCase() === cap.toLowerCase()) { 
      active.delete(from); 
      delete global.gameHints[from];
      await sock.sendMessage(from, { 
        text: `✅ صح يا @${sender.split("@")[0]}! إنت الكسبان 🏆\nالإجابة هي: *${cap}*`, 
        mentions: [sender] 
      }); 
      return true; 
    } 
    return false; 
  } 
};
