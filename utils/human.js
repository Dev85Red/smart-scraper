// utils\human.js
const { waitInMiliSec } = require('./utils');

module.exports = {
    async humanScroll(page) {
        await page.evaluate(() => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight) clearInterval(timer);
            }, 400 + Math.random() * 300);
        });
    },

    async randomScroll(page) {
        for (let i = 0; i < 5 + Math.floor(Math.random() * 3); i++) {
            await page.mouse.move(
                100 + Math.random() * 400,
                200 + Math.random() * 300
            );
            await page.mouse.wheel({ deltaY: 100 + Math.random() * 100 });
            await waitInMiliSec(500 + Math.random() * 800);
        }
    },

    async humanType(page, selector, text) {
        for (let char of text) {
            await page.type(selector, char, { delay: 180 + Math.random() * 100 });
            if (Math.random() < 0.04) {
                await page.keyboard.press('Backspace');
                await waitInMiliSec(120);
                await page.type(selector, char, { delay: 150 });
            }
        }
    }
};
