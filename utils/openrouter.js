// utils/openrouter.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

async function generateMessage(about, designation) {
    try {
        const body = {
            model: 'openai/gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a LinkedIn copywriting expert.' },
                { role: 'user', content: `Given the following project description:\n\n"""\n${about}\n"""\n\nWrite a LinkedIn connection message for a professional whose title/skills are: ${designation}. Keep it warm, short and non-spammy. Provide a subject line too.` }
            ],
            temperature: 0.7
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

        console.log(`🔍 Generated message: ${JSON.stringify(json)}`);
        
        if (!json.choices || !json.choices.length) {
            throw new Error('No message returned from OpenRouter.');
        }

        // add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        return json.choices[0].message.content.trim();
    } catch (err) {
        console.error(`❌ Failed to generate message for: ${designation}`);
        console.error(err.message);
        return null;
    }
}

module.exports = {
    generateMessage
};
