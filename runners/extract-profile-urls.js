const fs = require('fs');
const path = require('path');
const { waitInMiliSec, convertToMs } = require('../utils/utils');
const { humanScroll, randomScroll } = require('../utils/human');
const { getBrowser } = require('../globals/browser');
const { delayBetweenPages } = require('../config');
const { LinkedinSelectors } = require('./cssSelectors')
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

async function collectPeopleProfileLinks(
    page,
    {
        maxLoads = 1000,
        maxRetriesOnNoGrowth = 3,
        extraDelayMin = 2,       // minutes for extra retries
        skipGrowthCheckUntil = 3 // keep clicking for these initial passes
    } = {}
) {
    const ts = () => new Date().toISOString();
    const log = (...args) => console.log(ts(), ...args);

    // safe wrappers for optional helpers (use existing if present)
    const convertToMsSafe = (value, unit) => {
        if (typeof convertToMs === 'function') return convertToMs(value, unit);
        const map = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
        return (map[unit] || 1000) * value;
    };
    const waitSafe = async (ms, randomize = false) => {
        if (typeof waitInMiliSec === 'function') return waitInMiliSec(ms, randomize);
        return page.waitForTimeout(ms);
    };
    const scrollSafe = async () => {
        if (typeof randomScroll === 'function') {
            try { await randomScroll(page); } catch (e) { log('[collectPeopleProfileLinks] ⚠️ randomScroll failed:', e.message); }
        } else {
            await page.waitForTimeout(300);
        }
    };

    // wait for initial content (try people list then anchors)
    try {
        await page.waitForSelector(LinkedinSelectors.peopleListUL, { visible: true, timeout: 15000 });
    } catch (_) {
        log('[collectPeopleProfileLinks] ⚠️ peopleListUL not visible, falling back to profile anchors...');
        try {
            await page.waitForSelector(LinkedinSelectors.profileAnchors, { visible: true, timeout: 15000 });
        } catch (err) {
            log('[collectPeopleProfileLinks] ❌ Required LinkedIn selectors not found. Aborting.');
            throw err;
        }
    }

    const found = new Set();

    // scrape current visible anchors and add to `found`
    const scrapeBatch = async () => {
        const hrefs = await page.$$eval(LinkedinSelectors.profileAnchors, anchors =>
            anchors
                .map(a => (a.href || a.getAttribute && a.getAttribute('href') || '').split('?')[0])
                .filter(Boolean)
        ).catch(err => {
            // If selector fails, return empty array
            return [];
        });

        for (const h of hrefs) found.add(h);
        log('[collectPeopleProfileLinks] 📥 Batch size:', hrefs.length, '| Total unique:', found.size);
        return hrefs;
    };

    // initial scrape
    await scrapeBatch();

    // read delayBetweenPages if present otherwise fallback defaults
    const dbpMin = (typeof delayBetweenPages !== 'undefined' && delayBetweenPages.minTime) ? delayBetweenPages.minTime : 1;
    const dbpMax = (typeof delayBetweenPages !== 'undefined' && delayBetweenPages.maxTime) ? delayBetweenPages.maxTime : 5;
    const dbpType = (typeof delayBetweenPages !== 'undefined' && delayBetweenPages.timeType) ? delayBetweenPages.timeType : 'minutes';

    for (let pass = 1; pass <= maxLoads; pass++) {
        // try primary selector for "Show more"
        let btnHandle = await page.$(LinkedinSelectors.showMoreBtn).catch(() => null);

        // fallback: XPath looking for button whose text contains "Show more"
        if (!btnHandle) {
            try {
                const handles = await page.$x("//button[contains(normalize-space(string(.)), 'Show more') or contains(normalize-space(string(.)), 'Show more results')]");
                if (handles && handles.length) btnHandle = handles[0];
            } catch (e) {
                // ignore xpath errors
            }
        }

        if (!btnHandle) {
            log('[collectPeopleProfileLinks] 🛑 No Show More button found. Stopping.');
            break;
        }

        // random wait between pages (configurable)
        const randomDelayUnits = Math.floor(Math.random() * (dbpMax - dbpMin + 1)) + dbpMin;
        const delayMs = convertToMsSafe(randomDelayUnits, dbpType);
        log(`[collectPeopleProfileLinks] ⏳ Waiting ~${randomDelayUnits} ${dbpType} before clicking Show More (pass ${pass}/${maxLoads})...`);
        await waitSafe(delayMs, true);

        // measure before count using list items if available
        const beforeCount = await page.$$eval(LinkedinSelectors.peopleListItems, els => els.length).catch(() => 0);

        log(`[collectPeopleProfileLinks] ➕ Clicking Show More (pass ${pass}/${maxLoads})…`);
        try {
            await btnHandle.click({ delay: 80 });
        } catch (clickErr) {
            // fallback to page.evaluate click if direct .click fails
            try { await page.evaluate(el => el.click(), btnHandle); } catch (e) {
                log('[collectPeopleProfileLinks] ⚠️ click failed:', clickErr.message || e.message);
            }
        }

        // short wait + human-like scroll
        await waitSafe(8000, true);
        await scrollSafe();

        // wait for more <li> items if possible (soft timeout)
        try {
            await page.waitForFunction(
                (sel, prev) => {
                    const ul = document.querySelector(sel);
                    return ul && ul.querySelectorAll(':scope > li').length > prev;
                },
                { timeout: 8000 },
                LinkedinSelectors.peopleListItems,
                beforeCount
            );
        } catch (e) {
            // ignore - we'll retry logic below
        }

        // scrape what we have after click
        await scrapeBatch();
        let afterCount = await page.$$eval(LinkedinSelectors.peopleListItems, els => els.length).catch(() => found.size);

        // Warmup window: skip stall detection for initial passes so we dig deeper like old behavior
        if (pass <= skipGrowthCheckUntil) {
            log(`[collectPeopleProfileLinks] info: pass ${pass} <= skipGrowthCheckUntil(${skipGrowthCheckUntil}), not checking for stall.`);
            continue;
        }

        // retry loop if no growth
        let retries = 0;
        while (afterCount <= beforeCount && retries < maxRetriesOnNoGrowth) {
            retries++;
            log(`[collectPeopleProfileLinks] ⚠️ No new items. Retry ${retries}/${maxRetriesOnNoGrowth} after extra wait...`);
            const extraMs = convertToMsSafe(extraDelayMin, 'minutes');
            await waitSafe(extraMs, true);
            await scrollSafe();
            await scrapeBatch();
            afterCount = await page.$$eval(LinkedinSelectors.peopleListItems, els => els.length).catch(() => found.size);
        }

        if (afterCount <= beforeCount) {
            log('[collectPeopleProfileLinks] 🛑 Still no new items after retries. Stopping.');
            break;
        }
    }

    return Array.from(found);
}

module.exports = {
    extractProfileUrls,
    extractCompaniesUrls,
    collectPeopleProfileLinks,
};
