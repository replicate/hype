# Python Repositories

https://python-repos.vercel.app

It's really hard to keep up with open source machine learning. Since (almost) every new Python repo on GitHub is an ML repo, let's just list all the latest Python repos in an easily readable format (i.e. HN-style).

This website is updated daily by pulling the 500 most starred repos from the past week from GitHub and HuggingFace. It can be filtered by repos created in the past week, past 3 days, and past day.

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
