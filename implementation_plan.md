# VoteWise – AI Election Assistant

VoteWise is a full-stack AI-powered chatbot that helps users navigate the election process. Users provide their age, state, and registration status, and the assistant gives personalized, step-by-step guidance using an LLM backed by the NVIDIA NIM API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Static HTML/CSS/JS served by Express |
| Backend | Node.js + Express (API routes + LLM proxy) |
| LLM | NVIDIA NIM API (`meta/llama-3.1-8b-instruct` or similar) |
| Storage | In-memory session (no DB for v1) |
| Deployment | **Single Docker container** — one Express server handles everything |

> **Single container, single server**: Express serves static files AND API routes. No separate frontend/backend containers.

---

## Project Structure

```
VoteWise/
├── src/
│   ├── server.js              # Main Express server (entry point)
│   ├── routes/
│   │   └── chat.js            # POST /api/chat  (LLM proxy)
│   └── public/                # Static frontend files
│       ├── index.html
│       ├── style.css
│       └── app.js
├── package.json
├── .env                       # NVIDIA_API_KEY (not committed)
├── .env.example
├── .gitignore
├── Dockerfile
└── prd.md
```

---

## Proposed Changes

### [NEW] `package.json`
- Dependencies: `express`, `dotenv`, `cors`
- Scripts: `start` (`node src/server.js`), `dev` (nodemon)

### [NEW] `src/server.js`
- Express server on **port 3000**
- Serves `src/public/` as static files
- Mounts `/api/chat` route from `src/routes/chat.js`
- Loads `NVIDIA_API_KEY` from `.env`

### [NEW] `src/routes/chat.js`
- `POST /api/chat` — accepts `{ messages: [...], context: { age, state, registered } }`
- Builds system prompt based on user context (decision engine)
- Calls NVIDIA NIM API
- Streams response back to frontend via SSE

### [NEW] `src/public/index.html`
- Single-page chat interface
- Onboarding form (age, state, registration status) shown first
- Clean, minimal design

### [NEW] `src/public/style.css`
- Minimal: Inter font, white/gray palette, responsive

### [NEW] `src/public/app.js`
- Handles form submission → stores user context
- POSTs messages to `/api/chat`
- Renders streaming tokens in real time

### [NEW] `Dockerfile`
- Base image: `node:20-alpine`
- Copies all source files
- Runs `npm install --production`
- Exposes port 3000
- CMD: `node src/server.js`

### [NEW] `.env.example`
- `NVIDIA_API_KEY=your_key_here`
- `PORT=3000`

### [NEW] `.gitignore`
- Ignores `.env`, `node_modules/`

---

## Key Logic (Decision Engine)

The system prompt will include rules:

| User State | Guidance |
|---|---|
| Age < 18 | Informs about eligibility age; tells them when they'll be eligible |
| Age ≥ 18, not registered | Step-by-step voter registration guide |
| Age ≥ 18, registered | Voting-day instructions, polling info, timeline |

---

## Open Questions

> [!IMPORTANT]
> **Please confirm before I start building:**
>
> 1. **NVIDIA Model** — Which model should I use? Suggested: `meta/llama-3.1-8b-instruct`. Do you have a preference?
> 2. **Streaming vs Non-streaming** — Should responses stream token-by-token (feels more AI-like) or return all at once?
> 3. **Firebase** — PRD mentions Firebase for auth/DB. Should I include it in v1 or skip for now?
> 4. **Multilingual** — PRD mentions Hindi/Marathi support. Include a language selector in v1?
> 5. **Deployment** — Are you deploying to Vercel, Google Cloud, or running locally for now?

---

## Verification Plan

- Start server locally and verify `/api/chat` responds correctly
- Test all three user paths (under 18, unregistered, registered)
- Verify streaming works in the browser
- Check `.env` is excluded from git (`.gitignore`)
