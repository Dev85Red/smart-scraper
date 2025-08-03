// tools/generate-subject-lines.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MESSAGE_BANK_PATH = path.join(__dirname, '../resources/message-bank.json');

async function generateSubject(content) {
  const body = {
    model: 'openai/gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an expert copywriter. Write a short, catchy LinkedIn message subject line (max 8 words) based on the message content below. It should hint at value, relevance, and action.'
      },
      {
        role: 'user',
        content: `Message: ${content}`
      }
    ],
    temperature: 0.6,
    max_tokens: 20
  };

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const json = await res.json();

  if (!json.choices || !json.choices.length) {
    throw new Error('No subject returned from OpenRouter.');
  }

  let subject = json.choices[0].message.content.trim();
  return subject.replace(/^["']|["']$/g, '').substring(0, 80);
}

(async () => {
  let messages = JSON.parse(fs.readFileSync(MESSAGE_BANK_PATH, 'utf-8'));

  for (let msg of messages) {
    if (!msg.subject) {
      try {
        console.log(`🔄 Generating subject for: ${msg.designation}`);
        msg.subject = await generateSubject(msg.content);
        await new Promise(r => setTimeout(r, 1000)); // delay to avoid rate limiting
      } catch (err) {
        console.warn(`⚠️ Failed to generate subject for: ${msg.key} – ${err.message}`);
        msg.subject = 'Let’s connect!';
      }
    }
  }

  fs.writeFileSync(MESSAGE_BANK_PATH, JSON.stringify(messages, null, 2));
  console.log('✅ Subject lines added to message-bank.json');
})();
