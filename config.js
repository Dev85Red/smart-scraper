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
    delayBetweenPages: {
        minTime: 1,
        maxTime: 5,
        timeType: 'minutes' // options: 'seconds' | 'minutes' | 'hours' | 'days'
    },
    searchKeywords: 'freelancer.com',
    searchCompany: 'freelancer.com'
};
