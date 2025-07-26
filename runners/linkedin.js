// runners/linkedin.js
const fs = require('fs');
const path = require('path');

const { searchKeywords } = require('../config');
const { waitInMiliSec } = require('../utils/utils');
const { humanScroll, humanType } = require('../utils/human');
const { extractProfileUrls, extractCompaniesUrls } = require('./extract-profile-urls');

module.exports = async function runLinkedIn(page, browser) {
  console.log('🔍 Starting LinkedIn scraping logic...');

  await page.waitForSelector('input.search-global-typeahead__input');
  await page.click('input.search-global-typeahead__input');
  await humanType(page, 'input.search-global-typeahead__input', searchKeywords);
  await page.keyboard.press('Enter');

  await waitInMiliSec(1000);
  await page.waitForSelector('#search-reusables__filters-bar');

  // here you need to wait for the people button: `#search-reusables__filters-bar > ul > li:nth-child(1) > button` and then click on it
  await page.waitForSelector('#search-reusables__filters-bar > ul > li:nth-child(1) > button');
  await page.click('#search-reusables__filters-bar > ul > li:nth-child(1) > button');

  await waitInMiliSec(1000);
  await humanScroll(page);
  await waitInMiliSec(2000);

  // await extractCompaniesUrls(page);
  console.log('🏢 Companies URLs extracted. Now extracting user profiles...');

  // ✅ Now extract user profiles
  await extractProfileUrls(page, browser);
};
