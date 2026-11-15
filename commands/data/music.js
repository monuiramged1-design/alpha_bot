const yts = require('yt-search');
const axios = require('axios');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "music",
    aliases: ["اغنية", "اغنيه"],
    async execute({ sock, msg, from, args }) {
        if (!args.length) return sock.sendMessage(from, { text: "❌ اكتب اسم الأغنية." }, { quoted: msg });
        
        const query = args.join(" ");
        await sock.sendMessage(from, { text: `🔍 جاري البحث: *${query}*...` }, { quoted: msg });

        try {
            const search = await yts(query);
            if (!search.videos || search.videos.length === 0) return sock.sendMessage(from, { text: "❌ مفيش نتائج." }, { quoted: msg });

            const videoUrl = search.videos[0].url;
            const videoTitle = search.videos[0].title;
            const filePath = path.join(__dirname, "..", "..", `song_${Date.now()}.mp3`);

            await sock.sendMessage(from, { text: `✅ لقيت: *${videoTitle}*\n⏳ جاري التحميل (الطريقة المباشرة)...` }, { quoted: msg });

            let success = false;

            // المحاولة 1: التحميل المباشر بـ ytdl-core
            try {
                await new Promise((resolve, reject) => {
                    const stream = ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' });
                    const writeStream = fs.createWriteStream(filePath);
                    stream.pipe(writeStream);
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                    stream.on('error', reject);
                });
                success = true;
            } catch (err) {
                console.log("Direct download failed, trying APIs...");
            }

            // المحاولة 2 و 3 و 4: السيرفرات الاحتياطية
            if (!success) {
                const apis = [
                    `https://api.yanzbotz.my.id/api/downloader/ytmp3?url=${videoUrl}`,
                    `https://api.siputzx.my.id/api/d/ytmp3?url=${videoUrl}`,
                    `https://api.nexoracle.com/downloader/ytmp3?url=${videoUrl}`
                ];

                for (const api of apis) {
                    try {
                        const res = await axios.get(api, { timeout: 10000 });
                        let dlUrl = null;
                        if (res.data.result && res.data.result.url) dlUrl = res.data.result.url;
                        else if (res.data.data && res.data.data.download) dlUrl = res.data.data.download;
                        
                        if (dlUrl) {
                            const audioRes = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 15000 });
                            fs.writeFileSync(filePath, Buffer.from(audioRes.data));
                            success = true;
                            break; // لو نجح بنوقف المحاولات
                        }
                    } catch (e) { continue; }
                }
            }

            if (success && fs.existsSync(filePath)) {
                await sock.sendMessage(from, { text: `✅ تم التحميل! جاري الإرسال...` }, { quoted: msg });
                const buffer = fs.readFileSync(filePath);
                
                try {
                    await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4', ptt: false }, { quoted: msg });
                } catch (e) {
                    await sock.sendMessage(from, { document: buffer, mimetype: 'audio/mpeg', fileName: `${videoTitle}.mp3` }, { quoted: msg });
                }
                
                setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 5000);
            } else {
                throw new Error("All methods failed");
            }

        } catch (error) {
            console.error("Music Error:", error);
            await sock.sendMessage(from, { text: `❌ السيرفرات كلها رفضت. جرب أغنية تانية (ممكن يكون فيه حظر مؤقت من يوتيوب على النت بتاعك).` }, { quoted: msg });
        }
    }
};
