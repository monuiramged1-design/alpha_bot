const w = ["مستشفى","الاسكندرية","كمبيوتر","مدرسة","شوكولاتة","ميكروفون","استقلال"]; 
const active = new Map();
global.gameHints = global.gameHints || {};

module.exports = { 
  name: "فكك", 
  async execute({ sock, msg, from }) { 
    const word = w[Math.floor(Math.random()*w.length)]; 
    const shuffled = word.split("").sort(() => Math.random()-0.5).join(""); 
    active.set(from, word); 
    global.gameHints[from] = `الكلمة تبدأ بحرف (${word.charAt(0)}) وعدد حروفها ${word.length}.`;
    await sock.sendMessage(from, { text: `🧩 فكك الحروف: *${shuffled}*\n\nعندك 30 ثانية. (اكتب .تلميح لو محتاج مساعدة)` }, { quoted: msg }); 
    setTimeout(() => { 
      if (active.get(from) === word) { 
        active.delete(from); 
        delete global.gameHints[from];
        sock.sendMessage(from, { text: `⏰ انتهى الوقت! الإجابة كانت: *${word}*` }); 
      } 
    }, 30000); 
  }, 
  async onMessage({ sock, msg, from, text, sender }) { 
    const word = active.get(from); 
    if (!word) return false; 
    if (text.trim() === word) { 
      active.delete(from); 
      delete global.gameHints[from];
      await sock.sendMessage(from, { 
        text: `✅ صح يا @${sender.split("@")[0]}! إنت الكسبان 🏆\nالكلمة كانت: *${word}*`, 
        mentions: [sender] 
      }); 
      return true; 
    } 
    return false; 
  } 
};
