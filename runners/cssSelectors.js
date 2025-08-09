// === SELECTORS (centralize for easy tweaking) ===
const LinkedinSelectors = {
    navPeopleLink: 'main[aria-label*="Organization page for"] nav.org-page-navigation a[href*="/people"]',
    peopleListUL: 'main[aria-label*="Organization page for"] div.org-people__card-margin-bottom div.scaffold-finite-scroll ul',
    peopleListItems: 'main[aria-label*="Organization page for"] div.org-people__card-margin-bottom div.scaffold-finite-scroll ul > li',
    profileAnchors: 'a[href*="linkedin.com/in/"].link-without-visited-state, a[href*="linkedin.com/in/"][data-test-app-aware-link]',
    showMoreBtn: 'main[aria-label*="Organization page for"] div.org-people__card-margin-bottom div.scaffold-finite-scroll div.display-flex button.artdeco-button[type="button"]'
};

// === EXPORT SELECTORS ===
module.exports = {
    LinkedinSelectors
};