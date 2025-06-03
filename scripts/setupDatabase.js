import supabase from '../lib/supabase.js';

async function setupDatabase() {
  console.log('Setting up database schema...');

  const sql = `
    -- Create the repositories table
    CREATE TABLE IF NOT EXISTS repositories (
        id TEXT NOT NULL,
        source TEXT NOT NULL,
        username TEXT,
        name TEXT,
        description TEXT,
        stars INTEGER DEFAULT 0,
        url TEXT,
        created_at TIMESTAMP WITH TIME ZONE,
        inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Composite primary key on id and source
        PRIMARY KEY (id, source)
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_repositories_source ON repositories(source);
    CREATE INDEX IF NOT EXISTS idx_repositories_created_at ON repositories(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_repositories_inserted_at ON repositories(inserted_at DESC);
    CREATE INDEX IF NOT EXISTS idx_repositories_stars ON repositories(stars DESC);

    -- Create a function to get the last modified time
    CREATE OR REPLACE FUNCTION repositories_last_modified()
    RETURNS TIMESTAMP WITH TIME ZONE AS $$
    BEGIN
        RETURN (SELECT MAX(inserted_at) FROM repositories);
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    // Unfortunately, Supabase JS client doesn't support running raw SQL directly
    // We need to use the REST API
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try an alternative approach - check if table exists first
      const { error: checkError } = await supabase
        .from('repositories')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.code === '42P01') {
        console.error('Table does not exist. Please run the following SQL in your Supabase dashboard:');
        console.error('\n' + sql);
        console.error('\nGo to: Your Supabase Project > SQL Editor > New Query');
        return false;
      } else if (!checkError) {
        console.log('Table already exists!');
        return true;
      } else {
        console.error('Unexpected error:', checkError);
        return false;
      }
    }

    console.log('Database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error.message);
    console.error('\nPlease run the SQL manually in your Supabase dashboard:');
    console.error('\n' + sql);
    return false;
  }
}

// Run the setup
setupDatabase().then(success => {
  if (!success) {
    process.exit(1);
  }
});