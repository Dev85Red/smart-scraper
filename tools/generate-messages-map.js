// tools/generate-messages-map.js

const fs = require('fs');
const path = require('path');
const { generateMessage } = require('../utils/openrouter');

// === CONFIG ===
const PROFILE_PATH = path.join(__dirname, '../output/profile-details.json');
const MESSAGE_BANK_PATH = path.join(__dirname, '../output/message-bank.json');
const PROJECT_FILE = path.join(__dirname, '../misc/project.md');

(async () => {
    const profiles = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8'));
    const aboutProject = fs.readFileSync(PROJECT_FILE, 'utf-8');

    const messages = [];
    const seenCombos = {};

    for (const profile of profiles) {
        const designation = profile.designation?.toLowerCase() || '';

        // ignore irrelevant
        if (designation.includes('math') || designation.includes('tutor')) continue;

        const key = designation.split('|')[0].trim();
        if (!seenCombos[key]) {
            try {
                const result = await generateMessage(aboutProject, key);
                const id = messages.length + 1;
                messages.push({ id, key, designation: key, content: result });
                seenCombos[key] = id;
                profile.message = id;
            } catch (err) {
                console.warn(`⚠️ Failed to generate message for: ${key} – ${err.message}`);
                profile.message = null;
            }
        } else {
            profile.message = seenCombos[key] || null;
        }
    }

    fs.writeFileSync(PROFILE_PATH, JSON.stringify(profiles, null, 2));
    fs.writeFileSync(MESSAGE_BANK_PATH, JSON.stringify(messages, null, 2));

    console.log('✅ Done generating personalized message references.');
})();
