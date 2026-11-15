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

function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    let matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function isMatch(userInput, targetName) {
    const normInput = normalizeArabic(userInput);
    const normTarget = normalizeArabic(targetName);
    
    if (normInput === normTarget) return true;
    if (normInput.includes(normTarget) || normTarget.includes(normInput)) return true;
    
    const maxDistance = normTarget.length > 4 ? 2 : 1;
    return levenshtein(normInput, normTarget) <= maxDistance;
}

module.exports = { isMatch };
