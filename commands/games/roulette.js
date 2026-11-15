const config = require("../../config.json");
const activeRoulettes = new Map();
module.exports = {
  name: "روليت", aliases: ["roulette"], groupOnly: true,
  async execute({ sock, msg, from, sender }) {
    if (!config.ownerNumbers.includes(sender.split("@")[0])) return;
    if (global.activeEvents[from]) return; // 🌟 القفل
    if (activeRoulettes.has(from)) return;
    activeRoulettes.set(from, { state: "JOINING", players: [], timer: null });
    global.activeEvents[from] = "روليت"; // 🌟 قفل الجروب
    await sock.sendMessage(from, { text: `🔫 *الروليت!*\nاكتبوا *"أنا جاهز"* (30 ثانية) ⏳\n(3 قلوب لكل لاعب ❤️❤️❤️)` });
    activeRoulettes.get(from).timer = setTimeout(() => {
      const game = activeRoulettes.get(from); if (!game) return;
      if (game.players.length < 2) { activeRoulettes.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: "❌ مفيش عدد." }); }
      startTurn(sock, from);
    }, 30000);
  },
  async onMessage({ sock, msg, from, text, sender }) {
    const game = activeRoulettes.get(from); if (!game) return false;
    const pushName = msg.pushName || "عضو";
    if (game.state === "JOINING") {
      if (text.trim() === "أنا جاهز" || text.trim() === "انا جاهز") {
        if (!game.players.find(p => p.id === sender)) {
          game.players.push({ id: sender, name: pushName, hearts: 3 });
          await sock.sendMessage(from, { text: `✅ @${sender.split("@")[0]} انضم!`, mentions: [sender] });
        }
      } return true;
    }
    if (game.state === "TURN" && game.currentPlayer.id === sender) {
      if (text.includes("طلق") || text.includes("اطلق")) {
        clearTimeout(game.timer);
        const isDead = Math.random() < (1 / 6);
        const player = game.players.find(p => p.id === sender);
        if (isDead) {
          player.hearts--;
          if (player.hearts <= 0) {
            game.players = game.players.filter(p => p.id !== sender);
            await sock.sendMessage(from, { text: `💥 *باااانج!* @${sender.split("@")[0]} مات!`, mentions: [sender] });
            if (game.players.length === 1) {
              const w = game.players[0]; if (global.logEvent) global.logEvent(from, "الروليت 🔫", w.id, w.name);
              activeRoulettes.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: `🏆 *الفائز @${w.id.split("@")[0]}* 👑`, mentions: [w.id] }), true;
            }
            if (game.players.length === 0) { activeRoulettes.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: "💀 الكل مات!" }), true; }
          } else { await sock.sendMessage(from, { text: `💥 @${sender.split("@")[0]} خسر قلب! (متبقي ${player.hearts})`, mentions: [sender] }); }
        } else { await sock.sendMessage(from, { text: `🍂 *كلاكيت..* @${sender.split("@")[0]} عاش!`, mentions: [sender] }); }
        const current = game.players.shift(); game.players.push(current);
        setTimeout(() => startTurn(sock, from), 2000); return true;
      }
    } return false;
  }
};
async function startTurn(sock, from) {
  const game = activeRoulettes.get(from); if (!game || game.players.length === 0) return;
  if (game.players.length === 1) {
    const w = game.players[0]; if (global.logEvent) global.logEvent(from, "الروليت 🔫", w.id, w.name);
    activeRoulettes.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: `🏆 *الفائز @${w.id.split("@")[0]}*`, mentions: [w.id] });
  }
  game.state = "TURN"; game.currentPlayer = game.players[0];
  await sock.sendMessage(from, { text: `🔫 دور @${game.currentPlayer.id.split("@")[0]}!\nقلوبه: ${"❤️".repeat(game.currentPlayer.hearts)}\nاكتب *"أطلق"* (10 ثواني) ⏳`, mentions: [game.currentPlayer.id] });
  game.timer = setTimeout(() => {
    const g = activeRoulettes.get(from); if (!g) return;
    const p = g.players.find(x => x.id === g.currentPlayer.id); p.hearts--;
    if (p.hearts <= 0) {
      g.players = g.players.filter(x => x.id !== g.currentPlayer.id);
      sock.sendMessage(from, { text: `💥 @${g.currentPlayer.id.split("@")[0]} اتجمد ومات!`, mentions: [g.currentPlayer.id] });
    } else { sock.sendMessage(from, { text: `⏰ @${g.currentPlayer.id.split("@")[0]} خسر قلب!`, mentions: [g.currentPlayer.id] }); }
    if (g.players.length === 1) {
      const w = g.players[0]; if (global.logEvent) global.logEvent(from, "الروليت 🔫", w.id, w.name);
      activeRoulettes.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: `🏆 *الفائز @${w.id.split("@")[0]}*`, mentions: [w.id] });
    }
    if (g.players.length === 0) { activeRoulettes.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: "💀 الكل مات!" }); }
    const cur = g.players.shift(); g.players.push(cur); setTimeout(() => startTurn(sock, from), 2000);
  }, 10000);
}
