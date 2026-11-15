const fs = require("fs");
const path = require("path");
const cooldown = require("./cooldown");
const config = require("../config.json");

// 🌟 ضفنا "writing" هنا عشان البوت يقرا الفولدر بتاعها
const categories = ["games", "protection", "admin", "data", "ayano", "ranks", "writing"];
const commands = new Map();
const listeners = [];

for (const cat of categories) {
  const dir = path.join(__dirname, "..", "commands", cat);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;
    const mod = require(path.join(dir, file));
    if (mod.name) commands.set(mod.name, mod);
    if (mod.onMessage) listeners.push(mod);
    if (mod.aliases) mod.aliases.forEach(a => commands.set(a, mod));
  }
}

async function handleCommand(sock, msg, from, sender, isGroup, cmd, args, raw) {
  const command = commands.get(cmd);
  if (!command) return;
  if (command.groupOnly && !isGroup) return sock.sendMessage(from, { text: "❌ الأمر ده للجروبات بس." }, { quoted: msg });
  const cd = cooldown(sender, cmd, config.cooldownMs);
  if (cd > 0) return sock.sendMessage(from, { text: `⏳ استنى ${cd} ثانية.` }, { quoted: msg });
  try { await command.execute({ sock, msg, from, sender, isGroup, args, raw, config }); } 
  catch (e) { console.error(e); await sock.sendMessage(from, { text: `💥 حصل خطأ في تنفيذ .${cmd}` }, { quoted: msg }); }
}
module.exports = { handleCommand, listeners, commands };
