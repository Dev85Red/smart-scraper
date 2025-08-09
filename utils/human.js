// utils/human.js
const { waitInMiliSec } = require('./utils');

module.exports = {
    async humanScroll(page, selector = null, { downPasses = 4 } = {}) {
        try {
            await page.evaluate(async ({ sel, downPasses }) => {
                const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
                const el = sel ? document.querySelector(sel) : (document.scrollingElement || document.body);
                if (!el) return;

                // Scroll down a random amount of times (never to bottom)
                for (let i = 0; i < downPasses; i++) {
                    el.scrollBy({ top: 150 + Math.floor(Math.random() * 200), behavior: 'auto' });
                    await sleep(300 + Math.random() * 250);
                }

                // Go back to the very top a bit faster
                while (el.scrollTop > 0) {
                    const step = Math.min(200 + Math.floor(Math.random() * 200), el.scrollTop);
                    el.scrollBy({ top: -step, behavior: 'auto' });
                    await sleep(150 + Math.random() * 150);
                }
            }, { sel: selector, downPasses });
        } catch (err) {
            console.warn('⚠️ humanScroll failed:', err.message);
        }
    },

    async randomScroll(page, { selector = null, passes = 6 } = {}) {
        try {
            const handle = selector ? await page.$(selector) : null;

            // If we can target the container, move the mouse *inside it* so wheel events apply there
            if (handle) {
                const box = await handle.boundingBox();
                if (box) {
                    for (let i = 0; i < passes; i++) {
                        try {
                            const x = box.x + 20 + Math.random() * Math.max(10, box.width - 40);
                            const y = box.y + 20 + Math.random() * Math.max(10, box.height - 40);
                            await page.mouse.move(x, y, { steps: 3 });
                            await page.mouse.wheel({ deltaY: 300 + Math.floor(Math.random() * 400) });
                            await waitInMiliSec(350 + Math.random() * 450, true);
                        } catch (scrollErr) {
                            console.warn('⚠️ Scroll step (container) failed:', scrollErr.message);
                        }
                    }
                    return;
                }
            }

            // Fallback: programmatic scroll (reliable even if wheel is ignored)
            await page.evaluate(async ({ selector, passes }) => {
                const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
                const el = selector ? document.querySelector(selector) : (document.scrollingElement || document.body);
                if (!el) return;

                for (let i = 0; i < passes; i++) {
                    el.scrollBy({ top: 600 + Math.floor(Math.random() * 300), left: 0, behavior: 'auto' });
                    await sleep(250 + Math.floor(Math.random() * 350));
                }
            }, { selector, passes });

        } catch (err) {
            console.warn('⚠️ randomScroll failed:', err.message);
        }
    },

    async humanType(page, selector, text) {
        try {
            for (let char of text) {
                try {
                    await page.type(selector, char, { delay: 480 + Math.random() * 100 });
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
