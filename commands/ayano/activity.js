module.exports = {
  name: "activity", groupOnly: true,
  async execute({ sock, msg, from }) {
    if (!global.activity || !global.activity[from]) return sock.sendMessage(from, { text: "❌ لا توجد بيانات نشاط كافية بعد." }, { quoted: msg });
    
    // حساب الوقت المتبقي للتصفير
    const now = Date.now();
    const timePassed = now - global.lastActivityReset;
    const timeLeft = (24 * 60 * 60 * 1000) - timePassed;
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    const sorted = Object.entries(global.activity[from]).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let text = "📊 *أكثر 5 أعضاء نشاطاً:*\n\n";
    sorted.forEach(([id, count], i) => { text += `${i+1}. @${id.split("@")[0]} : ${count} رسالة\n`; });
    
    text += `\n⏳ *سيتم تصفير النشاط بعد:* ${hoursLeft} ساعة و ${minsLeft} دقيقة.`;
    
    await sock.sendMessage(from, { text, mentions: sorted.map(s => s[0]) }, { quoted: msg });
  }
};
