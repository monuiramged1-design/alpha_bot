module.exports = {
  name: "استعداد",
  async execute({ sock, msg, from }) {
    const responses = ["أنا جاهز دايماً! 🫡", "البوت في الخدمة! ⚡", "يلا بينا نلعب! 🎮"];
    await sock.sendMessage(from, { text: responses[Math.floor(Math.random() * responses.length)] }, { quoted: msg });
  }
};
