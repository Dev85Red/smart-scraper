// runners/extract-profile-urls.js
const fs = require('fs');
const path = require('path');
const { waitInMiliSec } = require('../utils/utils');
const { randomScroll } = require('../utils/human');
const { delayBetweenPages } = require('../config');

const finalProfiles = [];

async function extractProfileUrls(page, browser) {
    let currentPage = 1;
    const baseUrl = page.url().split('&page=')[0]; // current search URL
    const dateStr = new Date().toISOString().split('T')[0];

    while (true) {
        console.log(`📄 Scraping page ${currentPage}`);

        await page.goto(`${baseUrl}&page=${currentPage}`, { waitUntil: 'networkidle2' });
        await waitInMiliSec(500, true);
        await randomScroll(page);
        await waitInMiliSec(500, true);

        const profileButtons = await page.$$('.linked-area');
        if (profileButtons.length === 0) break;

        const pageProfiles = [];

        for (let i = 0; i < profileButtons.length; i++) {
            const anchor = await profileButtons[i].$('div > div.mb1 div > div.display-flex span span a');
            if (!anchor) continue;

            const href = await page.evaluate(el => el.href, anchor);
            if (href.includes('/in/')) {
                const profileData = await scrapeSingleProfile(href, browser);
                pageProfiles.push(profileData);
            }

            await waitInMiliSec(300, true);
        }

        const filename = `profile-details-${dateStr}-page${currentPage}.json`;
        const filepath = path.join(__dirname, '../output', filename);
        fs.writeFileSync(filepath, JSON.stringify(pageProfiles, null, 2));
        console.log(`💾 Page ${currentPage} saved to ${filename}`);

        // After each page: go to home, scroll randomly
        await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });
        await randomScroll(page);

        const randomDelay = Math.floor(Math.random() * (delayBetweenPages.maxTime - delayBetweenPages.minTime + 1)) + delayBetweenPages.minTime;
        const delayMs = convertToMs(randomDelay, delayBetweenPages.timeType);

        console.log(`⏳ Waiting ~${randomDelay} ${delayBetweenPages.timeType} before next page...`);
        await waitInMiliSec(delayMs, true);

        currentPage++;
    }

    console.log('🎯 Finished scraping all pages.');
}

async function extractCompaniesUrls(page) {
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
}

async function scrapeSingleProfile(href, browser) {
    const page = await browser.newPage();
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitInMiliSec(150, true);

    await randomScroll(page);
    await waitInMiliSec(50, true);

    const data = {
        url: href,
        name: null,
        designation: null,
        email: null
    };

    data.name = await page.$eval(
        '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:nth-child(2) > div span a h1',
        el => el.innerText.trim()
    ).catch(() => null);

    await waitInMiliSec(100, true);

    data.designation = await page.$eval(
        '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:nth-child(2) > div > div:last-child',
        el => el.innerText.trim().split('\n').slice(0, 2).join(' | ')
    ).catch(() => null);

    await waitInMiliSec(50, true);

    const contactBtn = await page.$(
        '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:nth-child(2) a#top-card-text-details-contact-info'
    );

    if (contactBtn) {
        await contactBtn.click();
        await page.waitForSelector('#artdeco-modal-outlet section.pv-contact-info__contact-type', { timeout: 5000 }).catch(() => null);

        await waitInMiliSec(300, true);
        data.email = await page.$$eval(
            '#artdeco-modal-outlet section.pv-contact-info__contact-type a[href^="mailto:"]',
            nodes => nodes.length > 0 ? nodes[0].innerText.trim() : null
        ).catch(() => null);
    }

    await waitInMiliSec(2500, true);

    await page.close();
    return data;
}

module.exports = {
    extractProfileUrls,
    extractCompaniesUrls
}