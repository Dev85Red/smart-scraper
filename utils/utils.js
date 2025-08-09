// utils\utils.js

module.exports = {
    async waitInMiliSec(ms, randomize = false) {
        if (!randomize) return new Promise(resolve => setTimeout(resolve, ms));

        // Get a random divisor between 1.5 and 3
        const divisor = Math.random() * 1.5 + 1.5; // range: [1.5, 3.0]
        const lowerBound = Math.floor(ms / divisor);
        const finalWait = Math.floor(Math.random() * (ms - lowerBound + 1)) + lowerBound;

        return new Promise(resolve => setTimeout(resolve, finalWait));
    },
    convertToMs(value, unit) {
        const map = {
            seconds: 1000,
            minutes: 60 * 1000,
            hours: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000
        };
        return value * map[unit];
    },
    normalizeCompanyName(str = '') {
        return str
            .toLowerCase()
            .replace(/\u00A0/g, ' ')            // non‑breaking spaces
            .replace(/[.,™®]/g, '')             // punctuation/trademarks
            .replace(/\b(inc|ltd|llc|corp|co|gmbh|plc|pte|s\.a\.|s\.r\.l)\b/g, '')
            .replace(/\s+/g, ' ')               // collapse spaces
            .trim();
    }
}