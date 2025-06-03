# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Hype (https://hype.replicate.dev) is a Next.js application that aggregates the latest machine learning content from multiple sources including GitHub repositories, HuggingFace models, Reddit posts, and Replicate models. The site updates hourly and presents content in a Hacker News-style list.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
vercel dev
# or
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Update content manually (fetches from all sources)
npm run updateContent
```

## Environment Setup

Create a `.env.local` file with:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
REPLICATE_API_TOKEN=...  # Required for fetching Replicate models
```

## Architecture

### Data Flow
1. **Content Fetching**: The `updateContent` script (scripts/updateContent.js) fetches content from four sources:
   - GitHub: Python repositories created in the last week via GitHub API
   - HuggingFace: ML models via HuggingFace API
   - Reddit: Posts from r/MachineLearning, r/LocalLLaMA, r/StableDiffusion
   - Replicate: ML models via Replicate API

2. **Storage**: All fetched content is stored in Supabase database in a `repositories` table

3. **Display**: The main page (pages/index.js) queries Supabase and displays posts with filtering and sorting

### Key Components

- **pages/index.js**: Main page with filtering by time period (past day/3 days/week) and source selection
- **lib/content.js**: Core content fetching and filtering logic
  - `getContent()`: Queries Supabase with filters
  - `updateContent()`: Fetches from all sources and updates database
  - Custom sorting algorithm that weighs different sources differently
  - Filters out spam/crypto content
- **components/PostRow.js**: Individual post display component
- **components/SourcePicker.js**: UI for selecting which sources to display

### Important Implementation Details

- Posts are deduplicated using composite keys of (id, source)
- Reddit posts use base-36 ID conversion to numeric format
- Replicate models use hash of URL as ID
- Content filtering removes posts containing banned keywords (crypto, nft, etc.)
- Custom post sorting applies different weights to sources (Reddit posts multiplied by 0.3, Replicate uses non-linear weighting)