import axios from 'axios';
import supabase from './supabase';

export async function getPythonRepos(filter = 'all') {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const query = supabase
    .from('repositories')
    .select('*')
    .order('stars', { ascending: false })

  if (filter === 'past_day') {
    query.gt('created_at', oneDayAgo.toISOString());
  }
  if (filter === 'past_three_days') {
    query.gt('created_at', threeDaysAgo.toISOString());
  }

  const { data: repos, error } = await query;

  if (error) {
    console.error('Error fetching repositories:', error);
    return [];
  }

  return repos;
}

export async function updatePythonRepos() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const lastWeekDate = date.toISOString().slice(0, 10);

  for (let page = 1; page <= 5; page++) {
    const response = await axios.get(
      `https://api.github.com/search/repositories?q=language:python+created:>${lastWeekDate}&sort=stars&order=desc&per_page=100&page=${page}`
    );

    const repos = response.data.items;

    for (const repo of repos) {
      const { error } = await supabase
        .from('repositories')
        .upsert(
          {
            id: repo.id,
            username: repo.owner.login,
            name: repo.name,
            description: repo.description,
            stars: repo.stargazers_count,
            url: repo.html_url,
            created_at: repo.created_at,
          },
          { onConflict: 'id' } // Specify the primary key for conflict resolution
        );

      if (error) {
        console.error(`Error upserting repo ${repo.id}:`, error);
      } else {
        console.log(`Successfully upserted repo ${repo.id}`);
      }
    }
  }
}
