// utils/openrouter.js
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function generateMessage(about, designation) {
    try {
        const body = {
            model: 'openai/gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Generate LinkedIn connection messages under 300 characters as a project developer. Include: 1) Personal hook for their role 2) Specific project benefit 3) Clear call-to-action. Make it conversational and action-driving.'
                },
                {
                    role: 'user',
                    content: `I'm the developer of: ${about.substring(0, 1000)}\n\nWrite a connection message for a ${designation}. Include a specific benefit for their role and end with a clear call-to-action (like "Interested in early access?" or "Want to see a demo?"). Be conversational, not salesy and content should not exceed 300 chars.`
                }
            ],
            temperature: 0.7,
            max_tokens: 80  // Limit response length
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

        console.log(`🔍 Generated message: ${JSON.stringify(json).slice(0, 30)}...`);

        if (!json.choices || !json.choices.length) {
            throw new Error('No message returned from OpenRouter.');
        }

        let message = json.choices[0].message.content.trim();

        // Remove any quotes or formatting
        message = message.replace(/^["']|["']$/g, '');

        // Truncate if still too long
        if (message.length > 400) {
            message = message.substring(0, 227) + '...';
        }

        console.log(`📝 Final message (${message.length} chars): ${message}`);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        return message;
    } catch (err) {
        console.error(`❌ Failed to generate message for: ${designation}`);
        console.error(err.message);
        return null;
    }
}

// Optional: Fallback function for when API fails
function getFallbackMessage(about, designation) {
    const projectName = about.split('\n')[0].replace(/^#\s*/, '').substring(0, 30);
    return `Hi! I'm working on ${projectName} and would love to connect with fellow ${designation}s. Let's chat!`;
}

module.exports = {
    generateMessage,
    getFallbackMessage
};