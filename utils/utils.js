// utils\utils.js

module.exports = {
    async waitInMiliSec(ms, randomize = false) {
        if (!randomize) return new Promise(resolve => setTimeout(resolve, ms));

        // Get a random divisor between 1.5 and 3
        const divisor = Math.random() * 1.5 + 1.5; // range: [1.5, 3.0]
        const lowerBound = Math.floor(ms / divisor);
        const finalWait = Math.floor(Math.random() * (ms - lowerBound + 1)) + lowerBound;

        return new Promise(resolve => setTimeout(resolve, finalWait));
    }
}