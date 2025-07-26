// index.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { platforms } = require('./config');

// Import the LinkedIn runner
const runLinkedIn = require('./runners/linkedin');


puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    const target = Object.entries(platforms).find(([_, p]) => p.enabled);
    if (!target) return console.log('❌ No platform enabled in config.');

    const [platformName, platformConfig] = target;

    console.log(`🌐 Launching ${platformName}...`);
    await page.goto(platformConfig.url, { waitUntil: 'networkidle2' });

    console.log('🔒 Please log in manually...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log(`✅ Logged in to ${platformName}. Ready for next step.`);
    await runLinkedIn(page);
})();
