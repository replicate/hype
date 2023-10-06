# AI Hype

https://hype.replicate.dev

It's really hard to keep up with open source machine learning. Almost every new Python repo on GitHub is an ML repo, so we made a website that displays all the latest Python repos in a HN-like list. We also added Replicate and HuggingFace models, and posts from r/{LocalLLaMA,MachineLearning,StableDiffusion}.

The website is updated every hour.

## Development

I don't know next.js so this app was 99% written by GPT-4.

To run locally, first create a `.env.local` file with

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

Then start the app locally

```
vercel dev
```

### Want to run machine learning models yourself?

Check out [Replicate](https://replicate.com). We make it easy to run, push, and scale machine learning models.
