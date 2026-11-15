const config = require("../../config.json");
const questions = [{ q: "حاجة كل ما تاخد منها بتزيد؟", a: ["الحفرة", "حفرة"] }, { q: "عاصمة اليابان؟", a: ["طوكيو"] }, { q: "إيه الشهر اللي فيه 28 يوم؟", a: ["كل الشهور"] }, { q: "غاز نتنفسه؟", a: ["الأكسجين"] }];
const activeBombs = new Map();
function isCorrect(t, a) { return a.some(x => t.trim().includes(x) || x.includes(t.trim())); }
module.exports = {
    name: "قنبلة", groupOnly: true,
    async execute({ sock, msg, from, sender }) {
        if (!config.ownerNumbers.includes(sender.split("@")[0])) return;
        if (global.activeEvents[from]) return; // 🌟 القفل
        if (activeBombs.has(from)) return;
        activeBombs.set(from, { state: "JOINING", players: [], timer: null });
        global.activeEvents[from] = "قنبلة"; // 🌟 قفل الجروب
        await sock.sendMessage(from, { text: `💣 *القنبلة!*\nاكتبوا *"أنا جاهز"* (15 ثانية) ⏳` });
        activeBombs.get(from).timer = setTimeout(() => {
            const g = activeBombs.get(from); if (!g) return;
            if (g.players.length < 2) { activeBombs.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: "❌ مفيش عدد." }); }
            startTurn(sock, from);
        }, 15000);
    },
    async onMessage({ sock, msg, from, text, sender }) {
        const game = activeBombs.get(from); if (!game) return false;
        if (game.state === "JOINING" && (text.trim() === "أنا جاهز" || text.trim() === "انا جاهز")) {
            if (!game.players.find(p => p.id === sender)) {
                game.players.push({ id: sender, name: msg.pushName || "عضو", hearts: 3 });
                await sock.sendMessage(from, { text: `✅ @${sender.split("@")[0]} انضم!`, mentions: [sender] });
            } return true;
        }
        if (game.state === "ANSWERING" && game.currentPlayer.id === sender) {
            if (isCorrect(text, game.q.a)) {
                clearTimeout(game.timer); game.state = "PASSING";
                await sock.sendMessage(from, { text: `✅ صح! ارمي القنبلة لـ @عضو\n(اكتب *القنبلة لـ @العضو*) (30 ثانية) ⏳` });
                game.timer = setTimeout(() => loseHeart(sock, from, sender, "اتأخر!"), 30000); return true;
            } else { clearTimeout(game.timer); loseHeart(sock, from, sender, "إجابة غلط!"); return true; }
        }
        if (game.state === "PASSING" && game.currentPlayer.id === sender) {
            const m = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (text.includes("القنبلة") && m.length > 0) {
                const t = game.players.find(p => p.id === m[0]);
                if (t && t.id !== sender) {
                    clearTimeout(game.timer); game.currentPlayer = t; game.state = "ANSWERING"; game.q = questions[Math.floor(Math.random() * questions.length)];
                    await sock.sendMessage(from, { text: `💣 القنبلة مع @${t.id.split("@")[0]}!\n❓ ${game.q.q} (30 ثانية) ⏳`, mentions: [t.id] });
                    game.timer = setTimeout(() => loseHeart(sock, from, t.id, "انتهى الوقت!"), 30000); return true;
                }
            }
        } return false;
    }
};
async function startTurn(sock, from) {
    const g = activeBombs.get(from); if (!g) return;
    if (g.players.length === 1) {
        const w = g.players[0]; if (global.logEvent) global.logEvent(from, "القنبلة 💣", w.id, w.name);
        activeBombs.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: `🏆 *الفائز @${w.id.split("@")[0]}* 👑`, mentions: [w.id] });
    }
    g.currentPlayer = g.players[Math.floor(Math.random() * g.players.length)]; g.q = questions[Math.floor(Math.random() * questions.length)]; g.state = "ANSWERING";
    await sock.sendMessage(from, { text: `💣 مع @${g.currentPlayer.id.split("@")[0]}!\n❓ ${g.q.q} (30 ثانية) ⏳`, mentions: [g.currentPlayer.id] });
    g.timer = setTimeout(() => loseHeart(sock, from, g.currentPlayer.id, "انتهى الوقت!"), 30000);
}
async function loseHeart(sock, from, id, reason) {
    const g = activeBombs.get(from); if (!g) return;
    const p = g.players.find(x => x.id === id); if (!p) return; p.hearts--;
    if (p.hearts <= 0) { g.players = g.players.filter(x => x.id !== id); await sock.sendMessage(from, { text: `💥 ${reason} @${id.split("@")[0]} خرج!`, mentions: [id] }); }
    else { await sock.sendMessage(from, { text: `💥 ${reason} @${id.split("@")[0]} خسر قلب! (متبقي ${p.hearts})`, mentions: [id] }); }
    if (g.players.length === 1) {
        const w = g.players[0]; if (global.logEvent) global.logEvent(from, "القنبلة 💣", w.id, w.name);
        activeBombs.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: `🏆 *الفائز @${w.id.split("@")[0]}*`, mentions: [w.id] });
    }
    setTimeout(() => startTurn(sock, from), 2000);
}
