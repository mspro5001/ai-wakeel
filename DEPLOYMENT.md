# AI Wakeel - Multi-Agent System

## What is this?

A fully autonomous AI agent system built for Arabic content creators. Uses 4 specialized agents orchestrated in a pipeline:

1. **Scout Agent** - Discovers trending TikTok content via Puppeteer + ContentRewards API
2. **Legal Agent** - AI-powered compliance checking using NVIDIA NIM LLM
3. **Publisher Agent** - Uploads content to TikTok via official API
4. **Reporter Agent** - Sends status reports via Telegram bot + Email

The dashboard provides a full control panel to monitor and trigger pipelines in real time.

## Architecture

```
client/   → React + Vite + Tailwind (SPA Dashboard)
server/   → Express + Socket.IO (Backend API + Agents)
storage/  → SQL.js database (file-based)
```

The client talks to the server via REST (`/api/*`) and Socket.IO for live updates.

## Live URLs

- **Client (deployed)**: https://ai-wakeel-bgmxji.web.app
- **Server**: not yet deployed (steps below)
- **GitHub**: https://github.com/mspro5001/ai-wakeel

## How to deploy the server

The client is already live on Firebase. The server (which runs Puppeteer, SQLite, ffmpeg) needs a Node.js host that supports long-running processes, WebSockets, and Chrome. The codebase is already pushed to GitHub.

### Option 1: Railway (recommended - takes 2 minutes)

The CLI install is already done locally, but you need to complete the GitHub OAuth consent in your browser to authenticate. Once you do that, run:

```bash
cd "C:\Users\dell\Desktop\وكيل"
railway up -y
```

That single command will:
1. Open your browser to sign in to Railway (or sign up)
2. Create a new project from this directory
3. Build the client (`npm install && cd client && npm install && npm run build`)
4. Start the server (`node server/app.js`)
5. Expose it on a public URL

If the browser doesn't open for you, run without `-y`:

```bash
railway up
```

After deploy, Railway gives you a URL like `https://ai-wakeel-production.up.railway.app`. Then:

1. Set environment variables in the Railway dashboard (Variables tab):
   - `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_ACCESS_TOKEN`
   - `CONTENTREWARDS_USERNAME`, `CONTENTREWARDS_PASSWORD`
   - `NVIDIA_NIM_API_KEY`
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   - `EMAIL_USER`, `EMAIL_PASS`
   - `JWT_SECRET` (any random string)
   - `RENDER_EXTERNAL_URL` = your Railway URL
2. Update the Firebase client to point at the new server:
   - Edit `client/.env.production` to set `VITE_API_URL=https://<your-railway-url>/api`
   - Run `cd client && npm run build`
   - Run `firebase deploy --only hosting`

### Option 2: Render.com (also free)

The repository already has a `render.yaml` blueprint. Render will pick it up automatically:

1. Go to https://render.com and sign in with GitHub
2. Click "New +" → "Blueprint"
3. Select repo `mspro5001/ai-wakeel`
4. Render reads `render.yaml` and creates the service
5. Add the secrets (just like Railway above)

### Option 3: GitHub Actions

`.github/workflows/deploy.yml` is already in place. To use it, create a Railway project token:

1. Run `railway login` in your browser first
2. Then `railway init` to create the project
3. Run `railway token` to get a project-scoped token
4. Add it as a `RAILWAY_TOKEN` secret in GitHub repo settings

After that, every push to `main` triggers a deploy automatically.

## Local development

```bash
# Install
npm install
cd client && npm install && cd ..

# Build client
cd client && npm run build && cd ..

# Run server
node server/app.js
```

Open http://localhost:3000

## What's deployed

### Client (Firebase Hosting)
- Dashboard with 5 tabs (Overview, Agents, Campaigns, Activity, Settings)
- Pipeline trigger with real-time Socket.IO log streaming
- Auto-refresh every 5s
- URL: https://ai-wakeel-bgmxji.web.app

### Server (NOT deployed yet)
- 4 specialized agents in `server/modules/agents/`
- Orchestrator with live Socket.IO events
- Health check at `/api/health`
- Dashboard API at `/api/dashboard/*`
- Agent control API at `/api/agents/*`

### GitHub
- Repo: https://github.com/mspro5001/ai-wakeel
- Already initialized and synced

## Environment variables

The server needs:

| Var | What |
|---|---|
| `PORT` | HTTP port (Railway sets this to 3000 by default) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Random string for token signing |
| `TIKTOK_CLIENT_KEY` | TikTok app client key |
| `TIKTOK_CLIENT_SECRET` | TikTok app client secret |
| `TIKTOK_ACCESS_TOKEN` | TikTok user access token |
| `CONTENTREWARDS_USERNAME` | ContentRewards login email |
| `CONTENTREWARDS_PASSWORD` | ContentRewards password |
| `NVIDIA_NIM_API_KEY` | NVIDIA NIM API key for Legal Agent LLM |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for Reporter Agent |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for reports |
| `EMAIL_USER` | SMTP user for Reporter email |
| `EMAIL_PASS` | SMTP password |
| `RENDER_EXTERNAL_URL` | Public URL of the deployment |

For local dev, these stay in `.env` (already configured with placeholders).
