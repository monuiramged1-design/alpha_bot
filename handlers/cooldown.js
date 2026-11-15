const cooldowns = new Map();
module.exports = function cooldown(sender, cmd, ms = 3000) {
  const key = `${sender}:${cmd}`;
  const now = Date.now();
  const last = cooldowns.get(key) || 0;
  if (now - last < ms) return Math.ceil((ms - (now - last)) / 1000);
  cooldowns.set(key, now);
  return 0;
};
