// tools/enrich-profiles.js

const fs = require('fs');
const path = require('path');

const PROFILE_PATH = path.join(__dirname, '../resources/profile-details.json');
const MESSAGE_BANK_PATH = path.join(__dirname, '../resources/message-bank.json');

const profiles = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8'));
const messages = JSON.parse(fs.readFileSync(MESSAGE_BANK_PATH, 'utf-8'));

const messageMap = {};
for (const msg of messages) {
  messageMap[msg.id] = msg;
}

function extractCleanName(rawName = '') {
  const blacklist = ['seo', 'expert', 'developer', 'dev', 'freelancer', 'freelance', 'coach', 'trainer', 'consultant', 'at', 'on', 'founder'];
  const words = rawName
    .replace(/[^a-zA-Z\s]/g, '')  // remove symbols
    .split(/\s+/)
    .filter(w => w.length > 1 && !blacklist.includes(w.toLowerCase()));

  if (words.length >= 2) return `${words[0]} ${words[1]}`;
  if (words.length === 1) return words[0];
  return 'there';
}

for (const profile of profiles) {
  const messageId = profile.message;
  const entry = messageMap[messageId];

  console.log(`🔍 Enriching profile: ${profile.name} with message ID: ${messageId}`);

  if (!entry) {
    console.warn(`⚠️ No message found for profile: ${profile.name}`);
    continue;
  }

  if (!profile.name || !profile.name.trim()) {
    console.warn(`⚠️ No name found for profile: ${profile.url}`);
    profile.name = 'there'; // default name if none provided
  }
  const cleanName = extractCleanName(profile.name);

  if (!entry.content) continue;
  const personalizedMessage = entry.content.replace(/\[Name\]/gi, cleanName);

  profile.subject = entry.subject || 'Let’s connect!';
  profile.message = personalizedMessage;
  profile.message_id = messageId;

  // add wait time to avoid rate limiting
  setTimeout(() => {
    console.log(`✅ Profile enriched: ${profile.name} - ${profile.subject}`);
  }, 1000);
}

fs.writeFileSync(PROFILE_PATH, JSON.stringify(profiles, null, 2));
console.log('✅ Profile details enriched with subject, content, and smart names.');
