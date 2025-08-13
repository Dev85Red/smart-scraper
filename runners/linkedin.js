// runners/linkedin.js

const { searchKeywords, searchCompany } = require('../config');
const { waitInMiliSec, normalizeCompanyName } = require('../utils/utils');
const { humanScroll, randomScroll, humanType } = require('../utils/human');
const { extractProfileUrls, collectPeopleProfileLinks } = require('./extract-profile-urls');
const { LinkedinSelectors } = require('./cssSelectors')

const linkedinSearch = async (page, searchQuery) => {
  try {
    await page.waitForSelector('input.search-global-typeahead__input', { visible: true, timeout: 30000 });
    await page.click('input.search-global-typeahead__input');
    await humanType(page, 'input.search-global-typeahead__input', searchQuery);
    await page.keyboard.press('Enter');

    await page.waitForSelector('#search-reusables__filters-bar', { timeout: 15000 });
  } catch (err) {
    console.error('❌ Search bar not found or not visible:', err.message);
    return;
  }
}

const clickCompanyFromResults = async (page, searchCompany) => {
  const target = normalizeCompanyName(searchCompany);
  const linkSelector = 'div > div.mb1 div > div.display-flex span a[href*="linkedin.com/company"]';

  await page.waitForSelector(linkSelector, { visible: true, timeout: 15000 });

  for (let pass = 0; pass < 3; pass++) {
    const links = await page.$$(linkSelector);
    let bestMatch = { handle: null, score: -1, text: '', href: '' };

    for (const link of links) {
      const { text, href } = await page.evaluate(el => ({
        text: (el.textContent || '').trim(),
        href: el.getAttribute('href') || ''
      }), link);

      const norm = normalizeCompanyName(text);
      let score = -1;
      if (norm === target) score = 3;
      else if (norm.startsWith(target) || target.startsWith(norm)) score = 2;
      else if (norm.includes(target) || target.includes(norm)) score = 1;

      if (score > bestMatch.score) bestMatch = { handle: link, score, text, href };
    }

    if (bestMatch.handle && bestMatch.score >= 2) {
      console.log(`[clickCompanyFromResults] ✅ Clicking: "${bestMatch.text}" (${bestMatch.href})`);
      await Promise.allSettled([bestMatch.handle.click({ delay: 60 })]);
      // wait for a company-page-only element instead of navigation
      await page.waitForSelector('main[aria-label*="Organization page for"] nav.org-page-navigation', { timeout: 15000 });
      return { text: bestMatch.text, href: bestMatch.href };
    }

    console.log(`[clickCompanyFromResults] Pass ${pass + 1}: no solid match, scrolling for more results…`);
    await humanScroll(page);
    await randomScroll(page);
    await waitInMiliSec(1200, true);
  }

  // Fallback includes()
  const fallbackLinks = await page.$$(linkSelector);
  for (const link of fallbackLinks) {
    const text = normalizeCompanyName(await page.evaluate(el => (el.textContent || '').trim(), link));
    if (text.includes(normalizeCompanyName(searchCompany))) {
      console.log(`[clickCompanyFromResults] ⚠️ Using fallback includes() match: "${text}"`);
      await Promise.allSettled([link.click({ delay: 60 })]);
      await page.waitForSelector('main[aria-label*="Organization page for"] nav.org-page-navigation', { timeout: 15000 });
      return { text, href: await page.evaluate(el => el.getAttribute('href') || '', link) };
    }
  }

  console.warn('[clickCompanyFromResults] ❌ No matching company found in results.');
  return null;
};

const clickPeopleTab = async (page) => {
  console.log('[clickPeopleTab] 🔎 Looking for People tab...');
  await page.waitForSelector(LinkedinSelectors.navPeopleLink, { visible: true, timeout: 15000 });

  await Promise.allSettled([ page.click(LinkedinSelectors.navPeopleLink, { delay: 60 }) ]);
  // wait for people list to exist
  await page.waitForSelector('main[aria-label*="Organization page for"] div.scaffold-finite-scroll ul', { timeout: 15000 });

  console.log('[clickPeopleTab] ✅ People tab opened.');
};

async function runSearchOnLinkedIn(page) {
  console.log('🔍 Starting LinkedIn scraping logic...');

  try {
    await linkedinSearch(page, searchKeywords);
    await waitInMiliSec(1000, true);

    const peopleBtnSelector = '#search-reusables__filters-bar > ul > li:nth-child(1) > button';

    try {
      await page.waitForSelector(peopleBtnSelector, { visible: true, timeout: 15000 });
      const btn = await page.$(peopleBtnSelector);
      if (btn) {
        await btn.click();
      } else {
        console.warn('[runSearchOnLinkedIn]⚠️ People button not found.');
      }
    } catch (err) {
      console.warn('[runSearchOnLinkedIn]⚠️ Failed to interact with people filter:', err.message);
    }

    await waitInMiliSec(1000, true);
    await humanScroll(page);
    await waitInMiliSec(2000, true);

    // await extractCompaniesUrls(page);
    console.log('[runSearchOnLinkedIn]🏢 Companies URLs extracted. Now extracting user profiles...');
    await extractProfileUrls(page);

  } catch (err) {
    console.error('[runSearchOnLinkedIn]❌ Error in LinkedIn flow:', err.message);
  }
};

async function getProfileUrlsFromCompany(page) {
  console.log('[getProfileUrlsFromCompany]🏢 Extracting profile URLs from company page...');

  try {
    await linkedinSearch(page, searchCompany);
    await waitInMiliSec(5000, true);

    await humanScroll(page);
    const companiesBtnSelector = '#search-reusables__filters-bar > ul > li:nth-child(4) > button';

    try {
      await page.waitForSelector(companiesBtnSelector, { visible: true, timeout: 15000 });
      const btn = await page.$(companiesBtnSelector);
      if (btn) {
        await btn.click();
      } else {
        console.warn('[getProfileUrlsFromCompany]⚠️ Company button not found.');
      }
    } catch (err) {
      console.warn('[getProfileUrlsFromCompany]⚠️ Failed to interact with company filter:', err.message);
    }

    await waitInMiliSec(2000, true);
    await randomScroll(page);

    console.log('[getProfileUrlsFromCompany]🏢 Companies listed...');
    /**
     * 1 search through the given selectors match and click on the exact company
     * 2 opens the company page and add random scrolling and waiting
     * 3 click on the people tab/btn -> will list all the connected peoples
     * 4 extract profile URLs
     */

    // 1) pick the exact company from results
    const picked = await clickCompanyFromResults(page, searchCompany);
    if (!picked) return;

    console.log(`[getProfileUrlsFromCompany] ✅ Company selected: ${picked.text} (${picked.href})`);

    // 2) wait for the page to load and randomly scroll
    await waitInMiliSec(200, true);
    await humanScroll(page);

    // 3) Open People tab
    await clickPeopleTab(page);

    // 4) Harvest profile URLs (logs them)
    let uniqueProfileUrls = await collectPeopleProfileLinks(page, { maxLoads: 1000 }); // tweak loads as needed
    console.log('[getProfileUrlsFromCompany] ✅ Profile URLs collected:', uniqueProfileUrls.length);
    for (const url of uniqueProfileUrls) console.log(' -', url);

  } catch (err) {
    console.error('[getProfileUrlsFromCompany]❌ Error in LinkedIn flow:', err);
  }
}

module.exports = {
  runSearchOnLinkedIn,
  getProfileUrlsFromCompany
};