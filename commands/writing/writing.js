const config = require("../../config.json");

const questionsList = [
    "ناروتو", "لوفي", "إرين", "تانجيرو", "غوجو", "كاكاشي", "ساسكي", "زورو", "ميكاسا", "ليفاي",
    "سايتاما", "لايت", "إل", "ريوك", "جوكو", "فيجيتا", "غوهان", "كيرايتو", "أسونا", "كانيكي",
    "نيزوكو", "إينوسكي", "زينيتسو", "موزان", "شينوبو", "ميغومي", "نوبارا", "يوجي", "سوكونا", "ماكيسيما",
    "إيتشيغو", "روكيا", "أيزن", "غون", "كيلوا", "كورابيكا", "ديكو", "باكوغو", "تودوروكي", "أول مايت",
    "ليفي", "هانجي", "أرمين", "راينر", "أني", "إرفين", "هيسوكا", "كورابيكا", "ميسا", "نير"
];

global.activeWriting = global.activeWriting || new Map();

function normalizeArabic(text) {
    if (!text) return "";
    return text
        .replace(/[\u064B-\u065F]/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/[ىي]/g, "ي")
        .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function isCorrect(userInput, correctAnswers) {
    const normInput = normalizeArabic(userInput);
    if (!normInput || normInput.trim() === "") return false; 
    const normCorrect = normalizeArabic(correctAnswers);
    if (normInput === normCorrect) return true;
    if (normInput.includes(normCorrect) || normCorrect.includes(normInput)) return true;
    return false;
}

module.exports = {
    name: "writing",
    async execute({ sock, msg, from, sender, args }) {
        const action = args[0];

        if (action === "end") {
            if (!global.activeWriting.has(from)) return sock.sendMessage(from, { text: "⚠️ مفيش فعالية كتابة شغالة." });
            const game = global.activeWriting.get(from);
            clearTimeout(game.timer);
            
            let text = "⏹️ *تم إيقاف فعالية الكتابة!*\n\n🏆 *نتيجة اللعبة:*\n";
            const sorted = Object.entries(game.scores).sort((a, b) => b[1] - a[1]).slice(0, 5);
            
            if (sorted.length === 0) {
                text += "محدش جاب نقط للأسف! 😅";
            } else {
                const winner = sorted[0];
                text += `👑 *الفائز هو:* @${winner[0].split("@")[0]} بـ ${winner[1]} نقطة!\n`;
                text += `لقد أصبح **ملك الكتابة ✍️**!\n\n`;
                
                if (sorted.length > 1) {
                    text += "📊 *باقي المتصدرين:*\n";
                    sorted.slice(1).forEach(([id, score], i) => { 
                        text += `${i+2}. @${id.split("@")[0]} : ${score} نقطة\n`; 
                    });
                }
            }
            
            global.activeWriting.delete(from);
            if (global.activeEvents) delete global.activeEvents[from];
            return sock.sendMessage(from, { text, mentions: sorted.map(s => s[0]) });
        }

        if (global.activeEvents && global.activeEvents[from]) return sock.sendMessage(from, { text: "⚠️ فيه لعبة شغالة بالفعل في الجروب ده!" });
        if (global.activeWriting.has(from)) return sock.sendMessage(from, { text: "⚠️ فيه فعالية كتابة شغالة بالفعل." });

        const shuffledQ = [...questionsList].sort(() => Math.random() - 0.5);
        global.activeWriting.set(from, {
            state: "PLAYING",
            currentQ: 0,
            totalQ: 50,
            characters: shuffledQ.slice(0, 50),
            scores: {},
            timer: null
        });
        if (global.activeEvents) global.activeEvents[from] = "كتابة";

        await sock.sendMessage(from, { 
            text: `⎔⋅•━╌ ━╃ ⌬『✍️』⌬ ╄━╌━•⋅⎔
┇ بـدأت فـعـالـيـة سـرعـة الـكـتـابـة ✍️ ┇

📊 عدد الأسئلة: 50  ׀  ⏱️ 20 ثانية للسؤال

📝 اكتب اسم الشخصية اللي هتظهر بسرعة.
🚫 مفيش تسجيل مطلوب — أي حد يجاوب صح بيتحسبله.
⏹️ للإيقاف: *.writing end*

⎔┇تـوقـيـ✒️ـع : 「أركين」` 
        });

        setTimeout(() => nextQuestion(sock, from), 2000);
    },

    async onMessage({ sock, msg, from, text, sender }) {
        const game = global.activeWriting.get(from);
        if (!game || game.state !== "PLAYING") return false;

        const currentChar = game.characters[game.currentQ];
        if (!currentChar) return false;

        if (isCorrect(text, currentChar)) {
            clearTimeout(game.timer);
            
            if (!game.scores[sender]) game.scores[sender] = 0;
            game.scores[sender]++;

            await sock.sendMessage(from, { 
                text: `✅ صح يا @${sender.split("@")[0]}!\nإنت الكسبان 🏆\nالإجابة كانت: *${currentChar}*`,
                mentions: [sender]
            });

            game.currentQ++;
            setTimeout(() => nextQuestion(sock, from), 1500);
            return true;
        }
        return false;
    }
};

async function nextQuestion(sock, from) {
    const game = global.activeWriting.get(from);
    if (!game) return;

    if (game.currentQ >= game.totalQ) {
        let text = "🏁 *انتهت فعالية الكتابة!*\n\n🏆 *نتيجة اللعبة:*\n";
        const sorted = Object.entries(game.scores).sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        if (sorted.length === 0) {
            text += "محدش جاب نقط للأسف! 😅";
        } else {
            const winner = sorted[0];
            text += `👑 *الفائز هو:* @${winner[0].split("@")[0]} بـ ${winner[1]} نقطة!\n`;
            text += `لقد أصبح **ملك الكتابة ✍️**!\n\n`;
            
            if (sorted.length > 1) {
                text += "📊 *باقي المتصدرين:*\n";
                sorted.slice(1).forEach(([id, score], i) => { 
                    text += `${i+2}. @${id.split("@")[0]} : ${score} نقطة\n`; 
                });
            }
        }
        
        global.activeWriting.delete(from);
        if (global.activeEvents) delete global.activeEvents[from];
        return sock.sendMessage(from, { text, mentions: sorted.map(s => s[0]) });
    }

    const currentChar = game.characters[game.currentQ];

    await sock.sendMessage(from, { 
        text: `✍️ السؤال ${game.currentQ + 1} من ${game.totalQ}:\n\nاكتب الكلمة دي بسرعة: *${currentChar}*` 
    });

    game.state = "PLAYING";
    
    game.timer = setTimeout(async () => {
        const g = global.activeWriting.get(from);
        if (g && g.state === "PLAYING") {
            await sock.sendMessage(from, { 
                text: `⏰ *انتهى الوقت!* محدش جاوب.\n\nالإجابة الصح كانت: *${currentChar}*` 
            });
            g.currentQ++;
            setTimeout(() => nextQuestion(sock, from), 1500);
        }
    }, 20000);
}
