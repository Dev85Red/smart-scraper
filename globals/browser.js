// globals/browser.js
let browserInstance = null;

module.exports = {
    setBrowser: (browser) => { browserInstance = browser; },
    getBrowser: () => browserInstance
};
