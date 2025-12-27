# Hype

It's really hard to keep up with open source machine learning. Almost every new Python repo on GitHub is an ML repo, so we made a website that displays all the latest Python repos in a HN-like list. We also added Replicate and HuggingFace models, and posts from r/{LocalLLaMA,MachineLearning,StableDiffusion}.

The website is updated every hour via GitHub Actions.

## Local Dev

```bash
npm install
cp .dev.vars.example .dev.vars  # add your REPLICATE_API_TOKEN
npm run dev                      # uses local D1 database
```

To develop against the remote D1 database:
```bash
wrangler dev --remote
```

## Deploy (New Setup)

```bash
# 1. Create D1 database
wrangler d1 create hype

# 2. Update database_id in wrangler.jsonc with the ID from step 1

# 3. Run migration
wrangler d1 execute hype --remote --file=migrations/0001_init.sql

# 4. Set secrets
wrangler secret put REPLICATE_API_TOKEN

# 5. Deploy
npm run deploy
```

## Data Updates

Content updates hourly via GitHub Actions, which calls the `/api/update` endpoint.

Manual trigger: `npm run updateContent`

## Want to run AI models yourself?

Check out [Replicate](https://replicate.com). We make it easy to run, push, and scale machine learning models.
