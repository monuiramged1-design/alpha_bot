module.exports = {
  name: "ayanokouji",
  async execute({ sock, msg, from }) {
    const img = "https://i.imgur.com/k1G4q6w.jpeg"; // يمكنك تغييرها لاحقاً
    await sock.sendMessage(from, { image: { url: img }, caption: "🕶️ *Ayanokoji Kiyotaka*\nالفصل D، السنة الثانية." }, { quoted: msg });
  }
};
