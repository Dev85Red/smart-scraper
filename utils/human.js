// utils/human.js

const { waitInMiliSec } = require('./utils');

module.exports = {
    async humanScroll(page) {
        try {
            await page.evaluate(() => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= document.body.scrollHeight) clearInterval(timer);
                }, 400 + Math.random() * 300);
            });
        } catch (err) {
            console.warn('⚠️ humanScroll failed:', err.message);
        }
    },

    async randomScroll(page) {
        try {
            const times = 5 + Math.floor(Math.random() * 3);
            for (let i = 0; i < times; i++) {
                try {
                    await page.mouse.move(
                        100 + Math.random() * 400,
                        200 + Math.random() * 300
                    );
                    await page.mouse.wheel({ deltaY: 100 + Math.random() * 100 });
                    await waitInMiliSec(500 + Math.random() * 800);
                } catch (scrollErr) {
                    console.warn('⚠️ Scroll step failed:', scrollErr.message);
                }
            }
        } catch (err) {
            console.warn('⚠️ randomScroll failed:', err.message);
        }
    },

    async humanType(page, selector, text) {
        try {
            for (let char of text) {
                try {
                    await page.type(selector, char, { delay: 180 + Math.random() * 100 });
                    if (Math.random() < 0.04) {
                        await page.keyboard.press('Backspace');
                        await waitInMiliSec(120);
                        await page.type(selector, char, { delay: 150 });
                    }
                } catch (typeErr) {
                    console.warn(`⚠️ Typing character failed: ${char}`, typeErr.message);
                }
            }
        } catch (err) {
            console.warn('⚠️ humanType failed:', err.message);
        }
    }
};
