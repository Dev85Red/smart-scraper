// runners/linkedin.js

const { searchKeywords } = require('../config');
const { waitInMiliSec } = require('../utils/utils');
const { humanScroll, humanType } = require('../utils/human');
const { extractProfileUrls, extractCompaniesUrls } = require('./extract-profile-urls');

module.exports = async function runLinkedIn(page) {
  console.log('🔍 Starting LinkedIn scraping logic...');

  try {
    try {
      await page.waitForSelector('input.search-global-typeahead__input', { visible: true, timeout: 30000 });
      await page.click('input.search-global-typeahead__input');
      await humanType(page, 'input.search-global-typeahead__input', searchKeywords);
      await page.keyboard.press('Enter');
    } catch (err) {
      console.error('❌ Search bar not found or not visible:', err.message);
      return;
    }

    await waitInMiliSec(1000, true);

    await page.waitForSelector('#search-reusables__filters-bar', { timeout: 15000 });

    const peopleBtnSelector = '#search-reusables__filters-bar > ul > li:nth-child(1) > button';

    try {
      await page.waitForSelector(peopleBtnSelector, { visible: true, timeout: 15000 });
      const btn = await page.$(peopleBtnSelector);
      if (btn) {
        await btn.click();
      } else {
        console.warn('⚠️ People button not found.');
      }
    } catch (err) {
      console.warn('⚠️ Failed to interact with people filter:', err.message);
    }

    await waitInMiliSec(1000, true);
    await humanScroll(page);
    await waitInMiliSec(2000, true);

    // await extractCompaniesUrls(page);
    console.log('🏢 Companies URLs extracted. Now extracting user profiles...');
    await extractProfileUrls(page);

  } catch (err) {
    console.error('❌ Error in LinkedIn flow:', err.message);
  }
};
