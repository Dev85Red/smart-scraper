// runners/send-connection.js
const fs = require('fs');
const path = require('path');
const { waitInMiliSec } = require('../utils/utils');

module.exports = async function sendConnectionRequests(browser) {
    const inputPath = path.join(__dirname, '../output/profile-details.json');
    const outputPath = path.join(__dirname, '../output/profile-details.updated.json');

    let profiles = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    let updated = [];

    for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        if (profile.connected) {
            console.log(`✅ Already connected: ${profile.url}`);
            updated.push(profile);
            continue;
        }

        console.log(`🔗 Opening: ${profile.url}`);
        const page = await browser.newPage();
        await page.goto(profile.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitInMiliSec(2500, true);

        try {
            const mainBtnContainer = await page.$(
                '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:last-child'
            );
            if (!mainBtnContainer) throw new Error('❌ Button container not found');

            // Click More button
            const moreBtn = await mainBtnContainer.$('div > div:nth-child(3) button[aria-label="More actions"]');
            if (moreBtn) {
                await moreBtn.click();
                await waitInMiliSec(1000, true);

                const popupList = await page.$(
                    '#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside > div > div > main > section > div.ph5:nth-child(2) > div:last-child > div > div:nth-child(3) div ul'
                );

                if (popupList) {
                    const connectBtn = await popupList.$x('.//span[contains(text(), "Connect")]/..');
                    if (connectBtn.length > 0) {
                        await connectBtn[0].click();
                        await waitInMiliSec(1500, true);

                        // Click Send without note
                        const sendBtn = await page.$('button[aria-label="Send without a note"]');
                        if (sendBtn) {
                            await sendBtn.click();
                            console.log(`🤝 Sent connect request to ${profile.name}`);
                            profile.connected = true;
                        } else {
                            console.log(`⚠️ Connect popup appeared but send button missing`);
                            profile.connected = false;
                        }
                    } else {
                        console.log(`⚠️ No Connect option found in More menu.`);
                        profile.connected = false;
                    }
                } else {
                    console.log('❌ Popup list not found');
                    profile.connected = false;
                }
            } else {
                console.log('❌ More button not found');
                profile.connected = false;
            }
        } catch (err) {
            console.log(`❌ Error while connecting: ${err.message}`);
            profile.connected = false;
        }

        await page.close();
        updated.push(profile);
        await waitInMiliSec(1000, true);
    }

    fs.writeFileSync(outputPath, JSON.stringify(updated, null, 2));
    console.log(`💾 Updated profile data saved to ${outputPath}`);
};
