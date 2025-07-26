// index.js
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { platforms } = require('./config');
const runLinkedIn = require('./runners/linkedin');
const { waitInMiliSec } = require('./utils/utils');
const { setBrowser } = require('./globals/browser');

puppeteer.use(StealthPlugin());

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: process.env.HEADLESS === 'true', // initially for manual login
            userDataDir: './.auth/linkedIn', // persist session
            defaultViewport: null,
            args: ['--start-maximized'],
            protocolTimeout: 60000
        });

        setBrowser(browser);

        const page = await browser.newPage();

        const target = Object.entries(platforms).find(([_, p]) => p.enabled);
        if (!target) return console.log('❌ No platform enabled in config.');

        const [platformName, platformConfig] = target;

        console.log(`🌐 Launching ${platformName}...`);

        try {
            await page.goto(platformConfig.url, {
                waitUntil: 'networkidle2',
                timeout: 10000 // or 60000 for safety
            });
        } catch (err) {
            console.error(`❌ Failed to load ${platformName} URL:`, err);
            // return;
        }

        try {
            const globalSearchSelector = platformConfig.globalSearchSelector;

            const isLoggedIn = await page.$(globalSearchSelector);
            if (!isLoggedIn) {
                console.log('🔒 Not logged in. Please log in manually...');
                await page.waitForSelector(globalSearchSelector, { timeout: 180000 });
            }

            console.log(`✅ Logged in to ${platformName}. Ready for next step.`);
        } catch (err) {
            console.error('❌ Login wait timeout or selector error:', err.message);
            return;
        }

        await waitInMiliSec(2000);
        await runLinkedIn(page);

    } catch (err) {
        console.error('❌ Unexpected error in main workflow:', err.message);
    } finally {
        if (browser) {
            try {
                await browser.close();
                console.log('✅ Browser closed successfully.');
            } catch (closeErr) {
                console.error('❌ Error closing browser:', closeErr.message);
            }
        }
    }
})();