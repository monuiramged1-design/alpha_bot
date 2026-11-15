#!/bin/bash

# 1. إنشاء الملفات الأساسية
cat << 'INDEX' > index.js
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");
const { handleCommand } = require("./handlers/commandHandler");

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadJSON(file, fallback) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) { fs.writeFileSync(p, JSON.stringify(fallback, null, 2)); return fallback; }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

global.groupSettings = loadJSON("groups.json", {});
global.bannedWords = loadJSON("words.json", { words: config.banWords });
global.saveGroups = () => fs.writeFileSync(path.join(DATA_DIR, "groups.json"), JSON.stringify(global.groupSettings, null, 2));
global.saveWords = () => fs.writeFileSync(path.join(DATA_DIR, "words.json"), JSON.stringify(global.bannedWords, null, 2));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) startBot();
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = isGroup ? msg.key.participant : from;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";

    if (isGroup) {
      const settings = global.groupSettings[from] || {};
      if (settings.antilink) {
        const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com\/)/i;
        if (linkRegex.test(text)) {
          const isAdmin = await checkAdmin(sock, from, sender);
          if (!isAdmin) {
            try { await sock.sendMessage(from, { delete: msg.key }); await sock.sendMessage(from, { text: `⚠️ @${sender.split("@")[0]} لينك ممنوع!`, mentions: [sender] }); } catch {}
            return;
          }
        }
      }
      if (settings.anticontact && msg.message.contactMessage) {
        const isAdmin = await checkAdmin(sock, from, sender);
        if (!isAdmin) {
          try { await sock.sendMessage(from, { delete: msg.key }); await sock.sendMessage(from, { text: `⚠️ جهات الاتصال ممنوعة!`, mentions: [sender] }); } catch {}
          return;
        }
      }
      if (settings.banword !== false) {
        const words = global.bannedWords.words;
        if (words.some(w => text.toLowerCase().includes(w.toLowerCase()))) {
          try { await sock.sendMessage(from, { delete: msg.key }); await sock.sendMessage(from, { text: `🚫 كلمة محظورة!`, mentions: [sender] }); } catch {}
          return;
        }
      }
      if (settings.muted) {
        const isAdmin = await checkAdmin(sock, from, sender);
        if (!isAdmin) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
          return;
        }
      }
    }

    if (!text.startsWith(config.prefix)) return;
    const args = text.slice(config.prefix.length).trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();
    
    const listeners = require("./handlers/listeners");
    for (const L of listeners) {
      if (L.onMessage) {
        const handled = await L.onMessage({ sock, msg, from, sender, text, isGroup, args, raw: text });
        if (handled) return;
      }
    }
    await handleCommand(sock, msg, from, sender, isGroup, cmd, args, text);
  });
}

async function checkAdmin(sock, groupId, userId) {
  try {
    const meta = await sock.groupMetadata(groupId);
    const p = meta.participants.find(x => x.id === userId);
    return p?.admin === "admin" || p?.admin === "superadmin";
  } catch { return false; }
}
global.checkAdmin = checkAdmin;
startBot();
INDEX

cat << 'HANDLERS' > handlers/cooldown.js
const cooldowns = new Map();
module.exports = function cooldown(sender, cmd, ms = 3000) {
  const key = `${sender}:${cmd}`;
  const now = Date.now();
  const last = cooldowns.get(key) || 0;
  if (now - last < ms) return Math.ceil((ms - (now - last)) / 1000);
  cooldowns.set(key, now);
  return 0;
};
HANDLERS

cat << 'PERM' > handlers/permission.js
const config = require("../config.json");
async function requireAdmin(sock, from, sender) {
  if (config.ownerNumbers.includes(sender.split("@")[0])) return true;
  return await global.checkAdmin(sock, from, sender);
}
async function requireBotAdmin(sock, from) {
  try {
    const meta = await sock.groupMetadata(from);
    const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const p = meta.participants.find(x => x.id === botId);
    return p?.admin === "admin" || p?.admin === "superadmin";
  } catch { return false; }
}
module.exports = { requireAdmin, requireBotAdmin };
PERM

cat << 'CH' > handlers/commandHandler.js
const fs = require("fs");
const path = require("path");
const cooldown = require("./cooldown");
const config = require("../config.json");

const categories = ["games", "protection", "admin", "data"];
const commands = new Map();
const listeners = [];

for (const cat of categories) {
  const dir = path.join(__dirname, "..", "commands", cat);
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;
    const mod = require(path.join(dir, file));
    if (mod.name) commands.set(mod.name, mod);
    if (mod.onMessage) listeners.push(mod);
    if (mod.aliases) mod.aliases.forEach(a => commands.set(a, mod));
  }
}
fs.writeFileSync(path.join(__dirname, "listeners.js"), `module.exports = [${listeners.map(l => `require("../commands/${l.__dirname || ''}")`).join(',')}]`);

async function handleCommand(sock, msg, from, sender, isGroup, cmd, args, raw) {
  const command = commands.get(cmd);
  if (!command) return;

  if (command.groupOnly && !isGroup) {
    return sock.sendMessage(from, { text: "❌ الأمر ده للجروبات بس." }, { quoted: msg });
  }

  const cd = cooldown(sender, cmd, config.cooldownMs);
  if (cd > 0) return sock.sendMessage(from, { text: `⏳ استنى ${cd} ثانية.` }, { quoted: msg });

  try { await command.execute({ sock, msg, from, sender, isGroup, args, raw, config }); } 
  catch (e) { console.error(e); await sock.sendMessage(from, { text: `💥 حصل خطأ في تنفيذ .${cmd}` }, { quoted: msg }); }
}
module.exports = { handleCommand };
CH

# 2. أوامر الألعاب
cat << 'G1' > commands/games/nerd.js
module.exports = { name: "نرد", async execute({ sock, msg, from }) { const n = Math.floor(Math.random() * 6) + 1; const f = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣"]; await sock.sendMessage(from, { text: `🎲 النرد طلع: ${f[n-1]} (${n})` }, { quoted: msg }); } };
G1

cat << 'G2' > commands/games/xo.js
const games = new Map();
module.exports = {
  name: "xo",
  async execute({ sock, msg, from }) {
    if (games.has(from)) return sock.sendMessage(from, { text: "⚠️ فيه لعبة شغالة. خلصها الأول." }, { quoted: msg });
    const board = Array(9).fill(null);
    games.set(from, { board, player: "❌" });
    const render = (b) => b.map((c,i) => c || (i+1)).reduce((a,v,i) => a + v + (i%3===2 ? "\n" : " | "), "");
    await sock.sendMessage(from, { text: `🎮 *إكس أو* — إنت ❌\n\n${render(board)}\n\nابعت رقم الخانة (1-9).` }, { quoted: msg });
  },
  async onMessage({ sock, msg, from, text }) {
    const g = games.get(from); if (!g) return false;
    const n = parseInt(text); if (isNaN(n) || n < 1 || n > 9) return false;
    if (g.board[n-1]) return true;
    g.board[n-1] = g.player;
    const render = (b) => b.map((c,i) => c || (i+1)).reduce((a,v,i) => a + v + (i%3===2 ? "\n" : " | "), "");
    const win = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].find(([a,b,c]) => g.board[a] && g.board[a]===g.board[b] && g.board[a]===g.board[c]);
    if (win) { games.delete(from); return sock.sendMessage(from, { text: `${render(g.board)}\n\n🏆 فزت يا ${g.player}!` }), true; }
    if (g.board.every(Boolean)) { games.delete(from); return sock.sendMessage(from, { text: `${render(g.board)}\n\n🤝 تعادل.` }), true; }
    const empty = g.board.map((c,i) => c ? null : i).filter(x => x !== null);
    g.board[empty[Math.floor(Math.random()*empty.length)]] = "⭕";
    const win2 = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].find(([a,b,c]) => g.board[a] && g.board[a]===g.board[b] && g.board[a]===g.board[c]);
    if (win2) { games.delete(from); return sock.sendMessage(from, { text: `${render(g.board)}\n\n🤖 البوت فاز!` }), true; }
    if (g.board.every(Boolean)) { games.delete(from); return sock.sendMessage(from, { text: `${render(g.board)}\n\n🤝 تعادل.` }), true; }
    await sock.sendMessage(from, { text: render(g.board) }); return true;
  }
};
G2

cat << 'G3' > commands/games/fakik.js
const w = ["مستشفى","الاسكندرية","كمبيوتر","مدرسة","شوكولاتة","ميكروفون","استقلال"]; const active = new Map();
module.exports = {
  name: "فكك", async execute({ sock, msg, from }) {
    const word = w[Math.floor(Math.random()*w.length)]; const shuffled = word.split("").sort(() => Math.random()-0.5).join(""); active.set(from, word);
    await sock.sendMessage(from, { text: `🧩 فكك الحروف: *${shuffled}*\n\nعندك 30 ثانية.` }, { quoted: msg });
    setTimeout(() => { if (active.get(from) === word) { active.delete(from); sock.sendMessage(from, { text: `⏰ انتهى الوقت! الإجابة: *${word}*` }); } }, 30000);
  },
  async onMessage({ sock, msg, from, text }) {
    const word = active.get(from); if (!word) return false;
    if (text.trim() === word) { active.delete(from); await sock.sendMessage(from, { text: `✅ صح! *${word}*` }); return true; } return false;
  }
};
G3

cat << 'G4' > commands/games/capitals.js
const c = [["مصر","القاهرة"],["السعودية","الرياض"],["فرنسا","باريس"],["اليابان","طوكيو"],["البرازيل","برازيليا"],["كندا","أوتاوا"],["أستراليا","كانبرا"],["تركيا","أنقرة"]]; const active = new Map();
module.exports = {
  name: "عواصم", async execute({ sock, msg, from }) {
    const [country, capital] = c[Math.floor(Math.random()*c.length)]; active.set(from, capital);
    await sock.sendMessage(from, { text: `🌍 عاصمة *${country}* هي؟` }, { quoted: msg });
  },
  async onMessage({ sock, msg, from, text }) {
    const cap = active.get(from); if (!cap) return false;
    if (text.trim().toLowerCase() === cap.toLowerCase()) { active.delete(from); await sock.sendMessage(from, { text: `✅ صح! *${cap}*` }); return true; } return false;
  }
};
G4

cat << 'G5' > commands/games/eightball.js
const a = ["أيوه أكيد 💯","مستحيل ❌","يمكن 🤔","اعملها ومتفكرش 😎","الدنيا مش هتساعدك 😂","اسأل تاني بعدين ⏳","طبعاً لأ 🙅","إجابة غامضة... 👀"];
module.exports = { name: "8ball", async execute({ sock, msg, from, args }) { if (!args.length) return sock.sendMessage(from, { text: "❓ اكتب سؤالك بعد الأمر." }, { quoted: msg }); await sock.sendMessage(from, { text: `🎱 ${a[Math.floor(Math.random()*a.length)]}` }, { quoted: msg }); } };
G5

cat << 'G6' > commands/games/truthdare.js
const t = ["إيه أكتر حاجة بتخاف منها؟","آخر كذبة قلتها؟","مين أكتر شخص بتثق فيه؟"]; const d = ["ابعت ستوري بوشك 😂","اعمل فويس بغنية","ابعت آخر صورة في معرضك"];
module.exports = { name: "truth", aliases: ["dare"], async execute({ sock, msg, from, args, raw }) { const isDare = raw.startsWith(".dare") || args[0] === "dare"; const list = isDare ? d : t; await sock.sendMessage(from, { text: isDare ? `🔥 *جرأة:* ${list[Math.floor(Math.random()*list.length)]}` : `💬 *صراحة:* ${list[Math.floor(Math.random()*list.length)]}` }, { quoted: msg }); } };
G6

cat << 'G7' > commands/games/ship.js
module.exports = { name: "ship", aliases: ["marry"], groupOnly: true, async execute({ sock, msg, from }) { const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []; if (mentions.length < 2) return sock.sendMessage(from, { text: "❌ منشن اتنين: .ship @عضو1 @عضو2" }, { quoted: msg }); const pct = Math.floor(Math.random()*101); const bar = "❤️".repeat(Math.round(pct/10)) + "🖤".repeat(10-Math.round(pct/10)); await sock.sendMessage(from, { text: `💘 *نسبة الحب:* ${pct}%\n${bar}\n@${mentions[0].split("@")[0]} + @${mentions[1].split("@")[0]}`, mentions }, { quoted: msg }); } };
G7

# 3. الحماية
cat << 'P1' > commands/protection/antilink.js
module.exports = { name: "antilink", groupOnly: true, async execute({ sock, msg, from, sender }) { const isAdmin = await global.checkAdmin(sock, from, sender); if (!isAdmin) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg }); const g = global.groupSettings[from] ||= {}; g.antilink = !g.antilink; global.saveGroups(); await sock.sendMessage(from, { text: `🔗 مانع اللينكات: ${g.antilink ? "✅ مفعّل" : "❌ متوقف"}` }, { quoted: msg }); } };
P1

cat << 'P2' > commands/protection/anticontact.js
module.exports = { name: "anticontact", groupOnly: true, async execute({ sock, msg, from, sender }) { const isAdmin = await global.checkAdmin(sock, from, sender); if (!isAdmin) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg }); const g = global.groupSettings[from] ||= {}; g.anticontact = !g.anticontact; global.saveGroups(); await sock.sendMessage(from, { text: `📇 مانع الكونتاكت: ${g.anticontact ? "✅ مفعّل" : "❌ متوقف"}` }, { quoted: msg }); } };
P2

cat << 'P3' > commands/protection/banword.js
module.exports = { name: "banword", groupOnly: true, async execute({ sock, msg, from, sender, args }) { const isAdmin = await global.checkAdmin(sock, from, sender); if (!isAdmin) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg }); const g = global.groupSettings[from] ||= {}; if (!args.length) { g.banword = !g.banword; global.saveGroups(); return sock.sendMessage(from, { text: `🚫 فلتر الشتائم: ${g.banword ? "✅ مفعّل" : "❌ متوقف"}` }, { quoted: msg }); } const word = args.join(" ").toLowerCase(); const words = global.bannedWords.words; if (words.includes(word)) { global.bannedWords.words = words.filter(w => w !== word); global.saveWords(); return sock.sendMessage(from, { text: `➖ اتشالت: *${word}*` }, { quoted: msg }); } words.push(word); global.saveWords(); await sock.sendMessage(from, { text: `➕ اتضافت: *${word}*` }, { quoted: msg }); } };
P3

cat << 'P4' > commands/protection/mute.js
module.exports = { name: "mute", aliases: ["unmute"], groupOnly: true, async execute({ sock, msg, from, sender, raw }) { const isAdmin = await global.checkAdmin(sock, from, sender); if (!isAdmin) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg }); const g = global.groupSettings[from] ||= {}; g.muted = raw.startsWith(".mute"); global.saveGroups(); await sock.sendMessage(from, { text: `🔇 الجروب: ${g.muted ? "مقفول" : "مفتوح"}` }, { quoted: msg }); } };
P4

# 4. الإدارة
cat << 'A1' > commands/admin/kill.js
const { requireAdmin, requireBotAdmin } = require("../../handlers/permission");
module.exports = { name: "kill", aliases: ["killall"], groupOnly: true, async execute({ sock, msg, from, sender, raw }) { if (!await requireAdmin(sock, from, sender)) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg }); if (!await requireBotAdmin(sock, from)) return sock.sendMessage(from, { text: "❌ البوت لازم يكون أدمن." }, { quoted: msg }); if (raw.startsWith(".killall")) { const meta = await sock.groupMetadata(from); const ids = meta.participants.map(p => p.id).filter(id => id !== sock.user.id.split(":")[0] + "@s.whatsapp.net"); await sock.groupParticipantsUpdate(from, ids, "remove"); return sock.sendMessage(from, { text: `💀 تم طرد ${ids.length} عضو.` }, { quoted: msg }); } const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []; if (!mentions.length) return sock.sendMessage(from, { text: "❌ منشن عضو." }, { quoted: msg }); await sock.groupParticipantsUpdate(from, mentions, "remove"); await sock.sendMessage(from, { text: `💀 تم الطرد.`, mentions }, { quoted: msg }); } };
A1

cat << 'A2' > commands/admin/lock.js
const { requireAdmin, requireBotAdmin } = require("../../handlers/permission");
module.exports = { name: "lock", aliases: ["unlock"], groupOnly: true, async execute({ sock, msg, from, sender, raw }) { if (!await requireAdmin(sock, from, sender)) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg }); if (!await requireBotAdmin(sock, from)) return sock.sendMessage(from, { text: "❌ البوت لازم يكون أدمن." }, { quoted: msg }); const locked = raw.startsWith(".lock"); await sock.groupSettingUpdate(from, locked ? "announcement" : "not_announcement"); await sock.sendMessage(from, { text: locked ? "🔒 الجروب اتقفل." : "🔓 الجروب اتفتح." }, { quoted: msg }); } };
A2

cat << 'A3' > commands/admin/delete.js
module.exports = { name: "delete", aliases: ["del"], groupOnly: true, async execute({ sock, msg, from, sender }) { const isAdmin = await global.checkAdmin(sock, from, sender); if (!isAdmin) return sock.sendMessage(from, { text: "❌ للمشرفين بس." }, { quoted: msg }); const quoted = msg.message.extendedTextMessage?.contextInfo?.stanzaId; if (!quoted) return sock.sendMessage(from, { text: "❌ رد على الرسالة اللي عايز تمسحها." }, { quoted: msg }); await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: quoted, participant: msg.message.extendedTextMessage.contextInfo.participant } }); } };
A3

# 5. البيانات
cat << 'D1' > commands/data/ping.js
module.exports = { name: "ping", async execute({ sock, msg, from }) { const t = Date.now(); const sent = await sock.sendMessage(from, { text: "🏓 جاري القياس..." }, { quoted: msg }); await sock.sendMessage(from, { text: `🏓 *Pong!*\n⚡ السرعة: ${Date.now() - t}ms`, edit: sent.key }); } };
D1

cat << 'D2' > commands/data/status.js
module.exports = { name: "status", async execute({ sock, msg, from, config }) { const uptime = process.uptime(); const h = Math.floor(uptime/3600), m = Math.floor((uptime%3600)/60), s = Math.floor(uptime%60); await sock.sendMessage(from, { text: `🤖 *${config.botName}*\n\n⏱️ شغال من: ${h}س ${m}د ${s}ث\n💾 الذاكرة: ${(process.memoryUsage().rss/1048576).toFixed(1)} MB\n🟢 الحالة: متصل` }, { quoted: msg }); } };
D2

cat << 'D3' > commands/data/gp.js
module.exports = { name: "gp", groupOnly: true, async execute({ sock, msg, from }) { const meta = await sock.groupMetadata(from); const admins = meta.participants.filter(p => p.admin).length; await sock.sendMessage(from, { text: `📊 *${meta.subject}*\n\n👥 الأعضاء: ${meta.participants.length}\n🛡️ المشرفين: ${admins}\n🆔 \`${meta.id}\`\n📅 \`${new Date(meta.creation*1000).toLocaleDateString("ar-EG")}\`` }, { quoted: msg }); } };
D3

echo "✅ تم تجهيز كل الملفات بنجاح يا بوس!"
