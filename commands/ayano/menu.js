const fs = require("fs");
const path = require("path");

module.exports = {
  name: "rank",
  aliases: ["geo", "ayano"],
  async execute({ sock, msg, from, args }) {
    const section = args[0];

    // المنيو الأساسي
    if (!section) {
      const menuCaption = `『 Shadow Kangenou is here 』
『 Here's the help menu 』

1.rank 1
         👑 قسم السلطة والتحكم
2.rank 2
         🛡️ قسم الحماية والسيطرة
3.rank 3
         📊 قسم المعلومات والمراقبة
4.rank 4
         🎭 قسم الترفيه والألعاب
5.rank 5
         ⚜️ قسم النخبة والمطور
─「 Shadow bot 」─╮`;

      const imgPath = path.join(__dirname, "..", "..", "ayano.jpg");

      try {
        if (fs.existsSync(imgPath)) {
          await sock.sendMessage(from, { 
            image: fs.readFileSync(imgPath), 
            caption: menuCaption 
          }, { quoted: msg });
        } else {
          throw new Error("No image");
        }
      } catch (error) {
        await sock.sendMessage(from, { text: menuCaption }, { quoted: msg });
      }
      return;
    }

    // الأقسام
    let menuText = "";
    switch(section) {
      case "1":
        menuText = `⚜️『 𝐀𝐲𝐚𝐧𝐨𝐤𝐨𝐣𝐢 𝐊𝐢𝐲𝐨𝐭𝐚𝐤𝐚 』⚜️
『 👑 1. قسم الإدارة والتحكم 』
𝓐 ❦ ➻ 👑 .upa 
𝓐 ❦ ➻ 📉 .shha 
𝓐 ❦ ➻ 🚫 .kill 
𝓐 ❦ ➻ ⚔️ .killall 
𝓐 ❦ ➻ 🧹 .delete 
𝓐 ❦ ➻ 🔒 .lock 
𝓐 ❦ ➻ 🔓 .unlock 
𝓐 ❦ ➻ 🔕 .mute 
𝓐 ❦ ➻ 🔔 .unmute 
𝓐 ❦ ➻ 🔗 .link
𝓐 ❦ ➻ 📢 .ayhidden
╰────────────✧────────────╯`;
        break;
      case "2":
        menuText = `🛡️『 𝐀𝐲𝐚𝐧𝐨𝐤𝐨𝐣𝐢 𝐊𝐢𝐲𝐨𝐭𝐚𝐤𝐚 』🛡️
『 🛡️ 2. قسم الحماية والكلمات 』
𝓐 ❦ ➻ 🛡️ .antilink on/off
𝓐 ❦ ➻ 📇 .anticontact on/off
𝓐 ❦ ➻ 🚫 .no 
𝓐 ❦ ➻ 📄 .banword 
𝓐 ❦ ➻ 🗑️ .nodill 
𝓐 ❦ ➻ ⚙️ .wp on/off 
𝓐 ❦ ➻ 🛡️ .protkt on/off
𝓐 ❦ ➻ ⚔️ .soupr antilink on/off
𝓐 ❦ ➻ ⚔️ .soupr anticontact on/off
𝓐 ❦ ➻ 🛡️ .soupr protkt on/off
𝓐 ❦ ➻ 🛡️ .protection all off
╰────────────✧────────────╯`;
        break;
      case "3":
        menuText = `📊 *قسم المعلومات والمراقبة:*\n\n- .ping\n- .status\n- .gp\n- .activity\n- .lid\n- .grops\n- .رابط_غروب`;
        break;
      case "4":
        menuText = `🎭 *قسم الترفيه والألعاب:*\n\n- .نرد / .xo\n- .فكك / .عواصم\n- .truth / .dare\n- .8ball / .ship\n- .قنبلة / .بالونات\n- .تاج / .whoami`;
        break;
      case "5":
        menuText = `⚜️ *قسم النخبة والمطور:*\n\n- .events\n- .ayano_del\n- .link_pi / .link_stik\n- .link_vido / .vid_ay\n- .استعداد`;
        break;
      default:
        menuText = "❌ قسم غير موجود. اكتب .rank عشان تشوف الأقسام.";
    }

    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
  }
};
