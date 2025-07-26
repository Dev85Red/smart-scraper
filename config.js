// config.js
module.exports = {
    platforms: {
        linkedin: {
            url: 'https://www.linkedin.com/login',
            enabled: true,
            loginBtnSelector: '#organic-div > form > div.login__form_action_container > button',
            globalSearchSelector: 'input.search-global-typeahead__input',
        }
    },
    searchKeywords: '"freelancer.com"'
};
