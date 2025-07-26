// runners\linkedin.js
const { humanScroll, humanType } = require('../utils/human');

module.exports = async function runLinkedIn(page) {
    console.log('🔍 Starting LinkedIn scraping logic...');

    // Go to search
    await page.waitForSelector('input.search-global-typeahead__input');
    await page.click('input.search-global-typeahead__input');
    const searchKeywords = require('../config').searchKeywords;
    await humanType(page, 'input.search-global-typeahead__input', searchKeywords);
    await page.keyboard.press('Enter');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await humanScroll(page);

    console.log('📄 Search results loaded. Ready to extract...');
};
