module.exports = {
  name: "grops",
  async execute({ sock, msg, from }) {
    const groups = await sock.groupFetchAllParticipating();
    const list = Object.values(groups).map(g => `- ${g.subject} (${g.id.split("@")[0]})`).join("\n");
    await sock.sendMessage(from, { text: `📋 *الجروبات (${Object.keys(groups).length}):*\n\n${list}` }, { quoted: msg });
  }
};
