# Hype

It's really hard to keep up with open source machine learning. Almost every new Python repo on GitHub is an ML repo, so we made a website that displays all the latest Python repos in a HN-like list. We also added Replicate and HuggingFace models, and posts from r/{LocalLLaMA,MachineLearning,StableDiffusion}.

The website is updated every hour.

## Local Dev

```bash
npm install
cp .dev.vars.example .dev.vars  # fill in values
npm run dev
```

## Deploy

```bash
# Create D1 database and update database_id in wrangler.jsonc
wrangler d1 create hype
wrangler d1 execute hype --file=migrations/0001_init.sql

# Set secrets
wrangler secret put REPLICATE_API_TOKEN

npm run deploy
```

Content updates hourly. Manual trigger: `npm run updateContent`.

## Want to run AI models yourself?

Check out [Replicate](https://replicate.com). We make it easy to run, push, and scale machine learning models.
