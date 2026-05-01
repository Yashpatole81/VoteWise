const express = require('express');
const router = express.Router();

const NVIDIA_API_URL = process.env.NVIDIA_BASE_URL ? `${process.env.NVIDIA_BASE_URL}/chat/completions` : 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = process.env.MODEL_NAME || 'meta/llama-3.3-70b-instruct';

/**
 * Build a system prompt based on user context (decision engine)
 */
function buildSystemPrompt(context) {
  const { name, age, state, registered } = context;
  const parsedAge = parseInt(age, 10);

  let eligibilityGuidance = '';

  if (isNaN(parsedAge) || parsedAge <= 0) {
    eligibilityGuidance = 'The user has provided an invalid age or no age. Politely ask them to provide their real age so you can give accurate voting advice.';
  } else if (parsedAge > 120) {
    eligibilityGuidance = 'The user has provided an unusually high age (>120). Acknowledge it politely but remain focused on providing election guidance if they are indeed a senior citizen.';
  } else if (parsedAge < 18) {
    const yearsLeft = 18 - parsedAge;
    eligibilityGuidance = `The user is ${parsedAge} years old and is NOT yet eligible to vote in India. 
They need to be 18 or older. They will be eligible in approximately ${yearsLeft} year(s). 
Encourage them to prepare by learning about the process and remind them to register when they turn 18.`;
  } else if (!registered || registered === 'no') {
    eligibilityGuidance = `The user is ${parsedAge} years old and IS eligible to vote but is NOT yet registered. 
Their state is: ${state || 'not specified'}.
Guide them step-by-step through the voter registration process in India:
1. Visit the National Voters' Service Portal (voters.eci.gov.in)
2. Click on "New Registration (Form 6)"
3. Fill in personal details: name, DOB, address, and upload documents (Aadhaar, photo)
4. Submit and note the reference number
5. Check status on the same portal within a few days`;
  } else {
    eligibilityGuidance = `The user is ${parsedAge} years old and IS registered to vote in ${state || 'their state'}.
Help them with voting-day information:
- Bring your Voter ID card or any approved photo ID
- Find your polling booth via voters.eci.gov.in or the Voter Helpline app
- Voting hours are typically 7 AM to 6 PM
- Look for your name on the electoral roll using your EPIC number`;
  }

  return `You are VoteWise, a friendly and helpful AI election assistant for India. 
Your role is to help users understand the voting process in simple, clear language.
Keep responses concise, friendly, and actionable. Use numbered steps when giving instructions.
Avoid legal jargon. If you don't know something specific to the user's state, say so and direct them to the ECI website.

User context:
- Name: ${name || 'not provided'}
- Age: ${age || 'not provided'}
- State: ${state || 'not provided'}
- Registered to vote: ${registered || 'not provided'}

Guidance based on user profile:
${eligibilityGuidance}

Always end your response with an offer to answer follow-up questions.
Always address the user by their name (${name || 'voter'}) in your first response.`;
}

/**
 * POST /api/chat
 * Body: { messages: [{role, content}], context: { age, state, registered } }
 */
router.post('/', async (req, res) => {
  const { messages = [], context = {} } = req.body;

  if (!process.env.NVIDIA_API_KEY) {
    return res.status(500).json({ error: 'NVIDIA_API_KEY is not configured on the server.' });
  }

  const systemPrompt = buildSystemPrompt(context);

  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.6,
    max_tokens: 512,
    stream: true,
  };

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ error: `NVIDIA API error: ${err}` })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
          } else {
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                res.write(`data: ${JSON.stringify({ token })}\n\n`);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

module.exports = router;
