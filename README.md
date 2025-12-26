# Hype

ML/AI news aggregator from GitHub, HuggingFace, Reddit, and Replicate.

## Local Dev

```bash
npm install
cp .env.example .dev.vars  # fill in values
npm run dev
```

## Deploy

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put REPLICATE_API_TOKEN
npm run deploy
```

Content updates daily via cron. Manual trigger: `wrangler triggers deploy`.
