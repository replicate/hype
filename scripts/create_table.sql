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