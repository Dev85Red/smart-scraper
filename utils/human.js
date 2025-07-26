// utils\human.js

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

    async humanType(page, selector, text) {
        for (let char of text) {
            await page.type(selector, char);
            const delay = 100 + Math.random() * 80;
            await page.waitForTimeout(delay);
            if (Math.random() < 0.05) {
                await page.keyboard.press('Backspace');
                await page.waitForTimeout(120);
                await page.type(selector, char);
            }
        }
    }
};
