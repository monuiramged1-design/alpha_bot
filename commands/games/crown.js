const config = require("../../config.json");
const questions = [{ q: "مين بطل أنمي Naruto؟", a: ["ناروتو"] }, { q: "عاصمة مصر؟", a: ["القاهرة"] }, { q: "أكبر كوكب؟", a: ["المشتري"] }];
const activeCrowns = new Map();
function isCorrect(t, a) { return a.some(x => t.trim().includes(x) || x.includes(t.trim())); }
module.exports = {
    name: "تاج", groupOnly: true,
    async execute({ sock, msg, from, sender }) {
        if (!config.ownerNumbers.includes(sender.split("@")[0])) return;
        if (global.activeEvents[from]) return; // 🌟 القفل
        if (activeCrowns.has(from)) return;
        activeCrowns.set(from, { state: "JOINING", players: [], round: 1, crownHolder: null, timer: null });
        global.activeEvents[from] = "تاج"; // 🌟 قفل الجروب
        await sock.sendMessage(from, { text: `👑 *سرقة التاج!*\nاكتبوا *"أنا جاهز"* (15 ثانية) ⏳\n(10 جولات، التاج مع البوت)` });
        activeCrowns.get(from).timer = setTimeout(() => {
            const g = activeCrowns.get(from); if (!g) return;
            if (g.players.length < 2) { activeCrowns.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: "❌ مفيش عدد." }); }
            startRound(sock, from);
        }, 15000);
    },
    async onMessage({ sock, msg, from, text, sender }) {
        const game = activeCrowns.get(from); if (!game) return false;
        if (game.state === "JOINING" && (text.trim() === "أنا جاهز" || text.trim() === "انا جاهز")) {
            if (!game.players.find(p => p.id === sender)) {
                game.players.push({ id: sender, name: msg.pushName || "عضو", points: 0 });
                await sock.sendMessage(from, { text: `✅ @${sender.split("@")[0]} انضم!`, mentions: [sender] });
            } return true;
        }
        if (game.state === "ANSWERING" && game.players.find(p => p.id === sender)) {
            if (isCorrect(text, game.q.a)) {
                clearTimeout(game.timer);
                const w = game.players.find(p => p.id === sender);
                let act = "";
                if (game.crownHolder === null) { game.crownHolder = w; act = `👑 @${sender.split("@")[0]} أخد التاج!`; }
                else if (game.crownHolder.id === sender) act = `👑 @${sender.split("@")[0]} حافظ على التاج!`;
                else { game.crownHolder.points -= 1; act = `⚔️ @${sender.split("@")[0]} سرق التاج من @${game.crownHolder.id.split("@")[0]}! (-1)`; game.crownHolder = w; }
                game.round++;
                if (game.round > 10) {
                    if (global.logEvent) global.logEvent(from, "سرقة التاج 👑", game.crownHolder.id, game.crownHolder.name);
                    activeCrowns.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: `${act}\n🏆 *الملك هو @${game.crownHolder.id.split("@")[0]}* 👑`, mentions: [game.crownHolder.id] }), true;
                }
                await sock.sendMessage(from, { text: `${act}\n\n👑 *الجولة القادمة (${game.round}/10)*`, mentions: [sender, game.crownHolder.id] });
                setTimeout(() => startRound(sock, from), 3000); return true;
            }
        } return false;
    }
};
async function startRound(sock, from) {
    const g = activeCrowns.get(from); if (!g) return;
    g.state = "ANSWERING"; g.q = questions[Math.floor(Math.random() * questions.length)];
    let t = `👑 *الجولة ${g.round} من 10*\n`;
    if (g.crownHolder) t += `التاج مع: @${g.crownHolder.id.split("@")[0]} 👑\n`;
    else t += `التاج على الأرض!\n`;
    t += `❓ ${g.q.q} (30 ثانية) ⏳`;
    await sock.sendMessage(from, { text: t, mentions: g.crownHolder ? [g.crownHolder.id] : [] });
    g.timer = setTimeout(() => startRound(sock, from), 30000);
}
