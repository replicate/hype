# Development Guide

This guide will help you set up and run the AI Hype project locally.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account with database access

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/andreasjansson/python-repos.git
cd python-repos
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory with your Supabase credentials:

```bash
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
REPLICATE_API_TOKEN=your_replicate_api_token_here  # Optional, needed for fetching Replicate models
```

You can get these credentials from:
- **Supabase**: Go to your project settings in the Supabase dashboard
- **Replicate**: Get your API token from https://replicate.com/account

### 4. Run the Development Server

You have two options:

#### Option A: Using Vercel CLI (Recommended)
```bash
vercel dev
```

#### Option B: Using Next.js directly
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run updateContent` - Manually fetch latest content from all sources

## Testing Your Changes

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Test the UI changes**:
   - Check that all sources (GitHub, HuggingFace, Reddit, Replicate) load properly
   - Test the time filters (24h, 3d, 7d)
   - Verify the source picker checkboxes work
   - Ensure links open in new tabs

4. **Check responsiveness** by resizing your browser window

## Manual Content Update

To manually trigger a content update (normally runs hourly in production):

```bash
npm run updateContent
```

This will fetch the latest posts from all sources and update the Supabase database.

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Run `npm install` to ensure all dependencies are installed

2. **Database connection errors**
   - Verify your Supabase credentials in `.env.local`
   - Check that your Supabase project is active

3. **No content showing**
   - Run `npm run updateContent` to populate the database
   - Check browser console for any API errors

4. **Vercel CLI not found**
   - Install globally: `npm install -g vercel`

## Project Structure

```
├── components/          # React components
│   ├── PostRow.js      # Individual post display
│   └── SourcePicker.js # Source selection checkboxes
├── lib/                # Core functionality
│   ├── content.js      # Content fetching and filtering
│   ├── supabase.js     # Database client
│   └── utils.js        # Utility functions
├── pages/              # Next.js pages
│   ├── _app.js        # App wrapper
│   └── index.js       # Main page
├── scripts/            # Utility scripts
│   └── updateContent.js # Content update script
├── styles/             # CSS files
│   └── globals.css    # Global styles
└── docs/              # Documentation
    └── development.md # This file
```

## Making Changes

1. The main UI is in `pages/index.js`
2. Individual post styling is in `components/PostRow.js`
3. Global styles and Tailwind utilities are in `styles/globals.css`
4. Tailwind configuration is in `tailwind.config.js`

## Deployment

The app is designed to be deployed on Vercel. Push your changes to GitHub and connect your repository to Vercel for automatic deployments.