// runners/extract-profile-urls.js
const fs = require('fs');
const path = require('path');
const { waitInMiliSec } = require('../utils/utils');
const { randomScroll } = require('../utils/human');
const finalProfiles = [];

async function extractProfileUrls(page, browser) {
    console.log('🔗 Extracting user profile URLs...');

    const profileButtons = await page.$$('.linked-area');

    const urls = [];

    for (let i = 0; i < profileButtons.length; i++) {
        console.log(`🧭 Visiting search result ${i + 1}/${profileButtons.length}`);

        try {
            const anchor = await profileButtons[i].$('div > div.mb1 div > div.display-flex span span a');

            if (!anchor) {
                console.log('⛔️ No valid profile link found, skipping.');
                continue;
            }

            const href = await page.evaluate(el => el.href, anchor);
            if (href.includes('/in/')) {
                console.log(`✅ Collected: ${href}`);
                urls.push(href);
                const profileData = await scrapeSingleProfile(href, browser);
                finalProfiles.push(profileData);
            }

            await waitInMiliSec(800 + Math.random() * 400);
        } catch (err) {
            console.log(`❌ Error on result ${i + 1}:`, err.message);
        }
    }

    const unique = [...new Set(urls)];

    const profileDetailsPath = path.join(__dirname, '../output/profile-details.json');
    fs.writeFileSync(profileDetailsPath, JSON.stringify(finalProfiles, null, 2));
    console.log(`💾 Saved ${finalProfiles.length} full profiles to ${profileDetailsPath}`);
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
    await waitInMiliSec(1500, true);

    await randomScroll(page);
    await waitInMiliSec(1500, true);

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

    await waitInMiliSec(1500, true);

    data.designation = await page.$eval(
        '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:nth-child(2) > div > div:last-child',
        el => el.innerText.trim().split('\n').slice(0, 2).join(' | ')
    ).catch(() => null);

    await waitInMiliSec(1500, true);

    const contactBtn = await page.$(
        '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:nth-child(2) a#top-card-text-details-contact-info'
    );

    if (contactBtn) {
        await contactBtn.click();
        await page.waitForSelector('#artdeco-modal-outlet section.pv-contact-info__contact-type', { timeout: 5000 }).catch(() => null);

        await waitInMiliSec(1500, true);
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