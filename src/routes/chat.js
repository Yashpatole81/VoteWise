const express = require('express');
const router = express.Router();
const { VertexAI } = require('@google-cloud/vertexai');

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

  // Vertex AI initialization
  // It automatically uses Application Default Credentials (ADC)
  const project = process.env.GOOGLE_PROJECT_ID || '770048872917';
  const location = process.env.GOOGLE_LOCATION || 'us-central1';
  
  const vertexAI = new VertexAI({ project: project, location: location });
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
  });

  const systemPrompt = buildSystemPrompt(context);

  // Convert history to Vertex AI format
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const userMessage = messages[messages.length - 1]?.content || 'Hello';

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const chat = model.startChat({
      history: history,
    });

    // Vertex AI streaming
    const streamingResult = await chat.sendMessageStream([
        { text: systemPrompt + "\n\nUser Question: " + userMessage }
    ]);

    for await (const item of streamingResult.stream) {
      const chunkText = item.candidates[0].content.parts[0].text;
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ token: chunkText })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('Vertex AI Error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

module.exports = router;
