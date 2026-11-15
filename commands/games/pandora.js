const config = require("../../config.json");
global.activeGames = global.activeGames || new Map();
const activeGames = global.activeGames;
const boxEffects = [
    { text: "🤑 ربحت 50 نقطة!", type: "gain", value: 50 },
    { text: "💀 خسرت 30 نقطة!", type: "lose", value: 30 },
    { text: "💥 خسرت 50 نقطة!", type: "lose", value: 50 },
    { text: "🔄 هتبدل نقاطك مع لاعب!", type: "swap", value: 0 },
    { text: "🛡️ كسبت درع!", type: "shield", value: 0 },
    { text: "🎁 صندوق فاضي!", type: "empty", value: 0 }
];
module.exports = {
    name: "صندوق", aliases: ["pandora"], groupOnly: true,
    async execute({ sock, msg, from, sender, raw }) {
        if (!config.ownerNumbers.includes(sender.split("@")[0])) return;
        if (global.activeEvents[from]) return; // 🌟 القفل: لو فيه لعبة شغالة متردش
        if (raw.includes("الغاء") || raw.includes("الغي")) {
            if (!activeGames.has(from)) return; 
            const game = activeGames.get(from); clearTimeout(game.timer);
            if (game.players && game.players.length > 0) {
                game.players.sort((a, b) => b.points - a.points);
                const winner = game.players[0];
                if (global.logEvent) global.logEvent(from, "صندوق الباندورا 🎁 (إلغاء)", winner.id, winner.name);
                activeGames.delete(from);
                delete global.activeEvents[from]; // 🌟 فتح القفل
                return sock.sendMessage(from, { text: `🛑 *تم إلغاء اللعبة!*\n🏆 الفائز: @${winner.id.split("@")[0]} بـ ${winner.points} نقطة!`, mentions: [winner.id] });
            }
        }
        if (activeGames.has(from)) return; 
        activeGames.set(from, { state: "JOINING", players: [], round: 1, maxRounds: 10, currentChoices: {}, timer: null });
        global.activeEvents[from] = "صندوق"; // 🌟 قفل الجروب
        await sock.sendMessage(from, { text: `🎁 *صندوق الباندورا!*\n\nاكتبوا *"أنا جاهز"* (15 ثانية) ⏳\n(10 جولات، والأعلى نقاط بيكسب!)` });
        activeGames.get(from).timer = setTimeout(() => {
            const game = activeGames.get(from); if (!game) return;
            if (game.players.length < 2) { activeGames.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: "❌ مفيش عدد كافي." }); }
            startRound(sock, from);
        }, 15000);
    },
    async onMessage({ sock, msg, from, text, sender }) {
        const game = activeGames.get(from); if (!game) return false;
        const pushName = msg.pushName || "عضو";
        if (game.state === "JOINING") {
            if (text.trim() === "أنا جاهز" || text.trim() === "انا جاهز") {
                if (!game.players.find(p => p.id === sender)) {
                    game.players.push({ id: sender, name: pushName, points: 100, shield: false });
                    await sock.sendMessage(from, { text: `✅ @${sender.split("@")[0]} انضم!`, mentions: [sender] });
                }
            } return true;
        }
        if (game.state === "PICKING") {
            const choice = parseInt(text.trim());
            if ([1, 2, 3].includes(choice) && game.players.find(p => p.id === sender)) {
                if (!game.currentChoices[sender]) { game.currentChoices[sender] = choice; await sock.sendMessage(from, { text: `📦 @${sender.split("@")[0]} اختار ${choice}`, mentions: [sender] }); }
            } return true;
        } return false;
    }
};
async function startRound(sock, from) {
    const game = activeGames.get(from); if (!game) return;
    if (game.round > game.maxRounds) {
        game.players.sort((a, b) => b.points - a.points); const winner = game.players[0];
        if (global.logEvent) global.logEvent(from, "صندوق الباندورا 🎁", winner.id, winner.name);
        activeGames.delete(from); delete global.activeEvents[from];
        return sock.sendMessage(from, { text: `🏁 *انتهت الـ 10 جولات!*\n🏆 *الفائز @${winner.id.split("@")[0]}* بأعلى نقاط: ${winner.points} 💯`, mentions: [winner.id] });
    }
    if (game.players.length === 1) {
        const winner = game.players[0];
        if (global.logEvent) global.logEvent(from, "صندوق الباندورا 🎁", winner.id, winner.name);
        activeGames.delete(from); delete global.activeEvents[from];
        return sock.sendMessage(from, { text: `🏆 *الفائز @${winner.id.split("@")[0]}* 👑`, mentions: [winner.id] });
    }
    game.state = "PICKING"; game.currentChoices = {};
    let status = "📊 *اللاعبين:*\n"; game.players.forEach(p => { status += `@${p.id.split("@")[0]}: ${p.points} ${p.shield ? "🛡️" : ""}\n`; });
    await sock.sendMessage(from, { text: `${status}\n🎁 *الجولة ${game.round}/${game.maxRounds}*\nاختاروا: 📦 1 | 2 | 3 (15 ثانية) ⏳`, mentions: game.players.map(p => p.id) });
    game.timer = setTimeout(() => revealRound(sock, from), 15000);
}
async function revealRound(sock, from) {
    const game = activeGames.get(from); if (!game || game.state !== "PICKING") return;
    game.state = "REVEALING"; game.round++;
    let effects = [...boxEffects].sort(() => Math.random() - 0.5).slice(0, 3);
    let result = "📢 *النتيجة:*\n\n";
    game.players.forEach(p => { if (!game.currentChoices[p.id]) game.currentChoices[p.id] = Math.floor(Math.random() * 3) + 1; });
    for (let p of [...game.players]) {
        if (!game.players.find(x => x.id === p.id)) continue;
        const eff = effects[game.currentChoices[p.id] - 1];
        let act = `👤 @${p.id.split("@")[0]} -> 📦 ${game.currentChoices[p.id]}: ${eff.text}`;
        if (eff.type === "gain") p.points += eff.value;
        else if (eff.type === "lose") { if (p.shield) { p.shield = false; act += " (الدرع)"; } else p.points -= eff.value; }
        else if (eff.type === "shield") p.shield = true;
        else if (eff.type === "swap") {
            const others = game.players.filter(x => x.id !== p.id);
            if (others.length > 0) { const t = others[Math.floor(Math.random() * others.length)]; let tmp = p.points; p.points = t.points; t.points = tmp; act += ` 🔄 مع @${t.id.split("@")[0]}`; }
        }
        result += act + "\n";
    }
    game.players = game.players.filter(p => { if (p.points <= 0) { result += `💔 @${p.id.split("@")[0]} خرج!\n`; return false; } return true; });
    if (game.players.length === 0) { activeGames.delete(from); delete global.activeEvents[from]; return sock.sendMessage(from, { text: "💀 الكل خسر!" }); }
    if (game.players.length === 1) {
        const winner = game.players[0]; if (global.logEvent) global.logEvent(from, "صندوق الباندورا 🎁", winner.id, winner.name);
        activeGames.delete(from); delete global.activeEvents[from];
        return sock.sendMessage(from, { text: `${result}\n🏆 *الفائز @${winner.id.split("@")[0]}* بـ ${winner.points} نقطة!`, mentions: [winner.id] });
    }
    await sock.sendMessage(from, { text: result, mentions: game.players.map(p => p.id) });
    setTimeout(() => startRound(sock, from), 3000);
}
