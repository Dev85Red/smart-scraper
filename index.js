// index.js

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
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'],
            protocolTimeout: 60000
        });

        setBrowser(browser); // globally set

        const page = await browser.newPage();

        const target = Object.entries(platforms).find(([_, p]) => p.enabled);
        if (!target) return console.log('❌ No platform enabled in config.');

        const [platformName, platformConfig] = target;

        console.log(`🌐 Launching ${platformName}...`);

        try {
            await page.goto(platformConfig.url, { waitUntil: 'networkidle2' });
        } catch (err) {
            console.error(`❌ Failed to load ${platformName} URL:`, err.message);
            return;
        }

        const loginSelector = platformConfig.loginBtnSelector;
        const loginButtonVisible = await page.$(loginSelector);

        if (loginButtonVisible) {
            console.log('🔒 Please log in manually...');
            try {
                const globalSearchSelector = platformConfig.globalSearchSelector;
                await page.waitForSelector(globalSearchSelector, { timeout: 180000 });
            } catch (err) {
                console.error('❌ Login wait timeout or selector error:', err.message);
                return;
            }
        }

        console.log(`✅ Logged in to ${platformName}. Ready for next step.`);
        await waitInMiliSec(2000);
        await runLinkedIn(page); // browser is now accessible globally

    } catch (err) {
        console.error('❌ Unexpected error in main workflow:', err.message);
    }
})();
