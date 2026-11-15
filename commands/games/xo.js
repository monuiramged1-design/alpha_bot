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
