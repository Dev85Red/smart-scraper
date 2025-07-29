const fs = require('fs');
const path = require('path');
const { waitInMiliSec, convertToMs } = require('../utils/utils');
const { randomScroll } = require('../utils/human');
const { getBrowser } = require('../globals/browser');
const { delayBetweenPages } = require('../config');
const { timeout } = require('puppeteer');

const finalProfiles = [];

async function extractProfileUrls(page) {
    const browser = getBrowser();
    if (!browser) {
        console.error('❌ Browser not found. Aborting.');
        return;
    }

    console.log('🔗 Extracting user profile URLs...');
    let currentPage = 17;
    const baseUrl = page.url().split('&page=')[0];
    const dateStr = new Date().toISOString().split('T')[0];

    while (true) {
        try {
            console.log(`📄 Scraping page ${currentPage}`);

            await page.goto(`${baseUrl}&page=${currentPage}`, { waitUntil: 'load', timeout: 20000 });
            await waitInMiliSec(20000, true);
            await randomScroll(page);
            await waitInMiliSec(20000, true);

            const profileButtons = await page.$$('.linked-area');
            if (!profileButtons || profileButtons.length === 0) {
                console.log('✅ No more profiles found. Stopping.');
                break;
            }

            const pageProfiles = [];

            for (let i = 0; i < profileButtons.length; i++) {
                // console.log(`🧭 Visiting search result ${i + 1}/${profileButtons.length}`);
                try {
                    const anchor = await profileButtons[i].$('div > div.mb1 div > div.display-flex span span a');
                    if (!anchor) continue;

                    const href = await page.evaluate(el => el.href, anchor);
                    if (href.includes('/in/')) {
                        const profileData = await scrapeSingleProfile(href);
                        pageProfiles.push(profileData);
                    }

                    await waitInMiliSec(10000, true);
                } catch (err) {
                    console.warn(`⚠️ Error scraping profile ${i + 1}:`, err.message);
                }
            }

            const filename = `profile-details-${dateStr}-page${currentPage}.json`;
            const filepath = path.join(__dirname, '../output', filename);
            fs.writeFileSync(filepath, JSON.stringify(pageProfiles, null, 2));
            console.log(`💾 Page ${currentPage} saved to ${filename}`);

            // break and scroll for cooldown
            await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });
            await randomScroll(page);

            const randomDelay = Math.floor(Math.random() * (delayBetweenPages.maxTime - delayBetweenPages.minTime + 1)) + delayBetweenPages.minTime;
            const delayMs = convertToMs(randomDelay, delayBetweenPages.timeType);

            console.log(`⏳ Waiting ~${randomDelay} ${delayBetweenPages.timeType} before next page...`);
            await waitInMiliSec(delayMs, true);

            currentPage++;

        } catch (err) {
            console.error(`❌ Page ${currentPage} failed:`, err.message);
            break;
        }
    }

    const profileDetailsPath = path.join(__dirname, '../output/profile-details.json');
    fs.writeFileSync(profileDetailsPath, JSON.stringify(finalProfiles, null, 2));
    console.log(`✅ Final profile backup written to ${profileDetailsPath}`);
}

async function extractCompaniesUrls(page) {
    try {
        console.log('🏢 Extracting company URLs...');

        const companyLinks = await page.$$eval('a.app-aware-link', links =>
            links
                .map(link => link.href)
                .filter(href => href.includes('/company/') && !href.includes('jobs'))
        );

        const uniqueLinks = [...new Set(companyLinks)];
        console.log(`🏢 Found ${uniqueLinks.length} unique company URLs.`);

        const companyPath = path.join(__dirname, '../output/company-links.json');
        fs.writeFileSync(companyPath, JSON.stringify(uniqueLinks, null, 2));
        console.log(`💾 Saved to ${companyPath}`);
    } catch (err) {
        console.error('❌ Failed to extract companies:', err.message);
    }
}

async function scrapeSingleProfile(href) {
    const browser = getBrowser();
    const page = await browser.newPage();

    const data = {
        url: href,
        name: null,
        designation: null,
        email: null,
        website: null // ✅ new
    };

    try {
        await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitInMiliSec(15000, true);

        await randomScroll(page);
        await waitInMiliSec(15000, true);

        data.name = await page.$eval(
            '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:nth-child(2) > div span a h1',
            el => el.innerText.trim()
        ).catch(() => null);

        await waitInMiliSec(15000, true);

        data.designation = await page.$eval(
            '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:nth-child(2) > div > div:last-child',
            el => el.innerText.trim().split('\n').slice(0, 2).join(' | ')
        ).catch(() => null);

        await waitInMiliSec(1500, true);

        const contactBtn = await page.$(
            '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:nth-child(2) a#top-card-text-details-contact-info'
        );

        if (contactBtn) {
            try {
                await contactBtn.click();
                await page.waitForSelector('#artdeco-modal-outlet section.pv-contact-info__contact-type', { timeout: 5000 });
                await waitInMiliSec(15000, true);

                data.email = await page.$$eval(
                    '#artdeco-modal-outlet section.pv-contact-info__contact-type a[href^="mailto:"]',
                    nodes => nodes.length > 0 ? nodes[0].innerText.trim() : null
                ).catch(() => null);

                await waitInMiliSec(500, true);

                data.website = await page.$$eval(
                    '#artdeco-modal-outlet section.pv-contact-info__contact-type a[href^="http"]:not([href*="linkedin.com"])',
                    nodes => {
                        const websites = nodes.map(n => n.href);
                        return websites.length ? websites[0] : null;
                    }
                ).catch(() => null);
            } catch (err) {
                console.warn('⚠️ Failed to extract email:', err.message);
            }
        }

        finalProfiles.push(data);
    } catch (err) {
        console.error(`❌ Failed to scrape profile: ${href}`, err.message);
    } finally {
        await page.close();
    }

    return data;
}

module.exports = {
    extractProfileUrls,
    extractCompaniesUrls
};
