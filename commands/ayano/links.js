module.exports = {
  name: "link_pi", aliases: ["link_stik", "link_vido", "vid_ay"],
  async execute({ sock, msg, from, raw }) {
    let reply = "";
    if (raw.includes("link_pi")) reply = "🖼️ *روابط الصور:*\nhttps://pin.it/ayano";
    if (raw.includes("link_stik")) reply = "🎭 *روابط الملصقات:*\nhttps://getstickerpack.com/ayano";
    if (raw.includes("link_vido") || raw.includes("vid_ay")) reply = "🎬 *رابط الفيديو:*\nhttps://youtu.be/classroom";
    await sock.sendMessage(from, { text: reply }, { quoted: msg });
  }
};
