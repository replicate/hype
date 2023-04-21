import axios from "axios";
import supabase from "./supabase";

export async function getPythonRepos(filter = "all", source = "all") {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let query = supabase
    .from("repositories")
    .select("*")
    .order("stars", { ascending: false })
    .limit(500);

  if (source === "github") {
    query = query.eq("source", "github");
  } else if (source === "huggingface") {
    query = query.eq("source", "huggingface");
  }

  if (filter === "past_day") {
    query.gt("created_at", oneDayAgo.toISOString());
  } else if (filter === "past_three_days") {
    query.gt("created_at", threeDaysAgo.toISOString());
  } else {
    query.gt("created_at", sevenDaysAgo.toISOString());
  }

  const { data: repos, error } = await query;

  if (error) {
    console.error("Error fetching repositories:", error);
    return [];
  }

  const filteredRepos = repos.filter(
    (repo) => repo.username && repo.username.trim() !== ""
  );

  return filteredRepos;
}

export async function updatePythonRepos() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const lastWeekDate = date.toISOString().slice(0, 10);

  // Fetch Hugging Face repos
  const huggingFaceReposResponse = await axios.get(
    `https://huggingface.co/api/models?full=true&limit=5000&sort=lastModified&direction=-1`
  );

  const huggingFaceRepos = huggingFaceReposResponse.data;

  for (const repo of huggingFaceRepos) {
    if (repo.likes <= 1 || repo.downloads <= 1 || !repo.author) {
      continue;
    }
    const repoIdInt = parseInt(repo._id.substring(10), 16);
    var description = await getHuggingFaceRepoDescription(repo);
    description = truncateWithoutBreakingWords(description, 200);
    console.log(repo.id);
    console.log(description);
    const { error } = await supabase.from("repositories").upsert(
      {
        id: repoIdInt,
        source: "huggingface",
        username: repo.author,
        name: repo.id.split("/")[1],
        stars: repo.likes,
        description: description,
        url: `https://huggingface.co/${repo.id}`,
        created_at: repo.lastModified, // HF doesn't expose creation date
      },
      { onConflict: ["id", "source"] } // Specify the conflict resolution keys
    );

    if (error) {
      console.error(`Error upserting Hugging Face repo ${repo.id}:`, error);
    } else {
      console.log(`Successfully upserted Hugging Face repo ${repo.id}`);
    }
  }

  // Fetch GitHub repos
  for (let page = 1; page <= 5; page++) {
    const response = await axios.get(
      `https://api.github.com/search/repositories?q=language:python+created:>${lastWeekDate}&sort=stars&order=desc&per_page=100&page=${page}`
    );

    const repos = response.data.items;

    for (const repo of repos) {
      const { error } = await supabase.from("repositories").upsert(
        {
          id: repo.id,
          source: "github",
          username: repo.owner.login,
          name: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          url: repo.html_url,
          created_at: repo.created_at,
        },
        { onConflict: ["id", "source"] } // Specify the primary key for conflict resolution
      );

      if (error) {
        console.error(`Error upserting repo ${repo.id}:`, error);
      } else {
        console.log(`Successfully upserted repo ${repo.id}`);
      }
    }
  }
}

async function getHuggingFaceRepoDescription(repo) {
  const readmeFilename = repo.siblings.find(
    (sibling) => sibling.rfilename.toLowerCase() === "readme.md"
  )?.rfilename;

  if (!readmeFilename) {
    return "";
  }

  try {
    const readmeResponse = await axios.get(
      `https://huggingface.co/${repo.id}/raw/main/${readmeFilename}`
    );

    const readmeText = readmeResponse.data;

    // Extract the paragraph after the "Model Description" heading, if exists
    const modelDescriptionMatch = readmeText.match(
      /(?:^|\n)##\s*(?:Model [Dd]escription|Overview:?)[\r\n]+([\s\S]*?)(?:[\r\n]+\s*#|$)/
    );
    if (modelDescriptionMatch && modelDescriptionMatch[1]) {
      return modelDescriptionMatch[1].trim();
    }

    // Extract the paragraph after the first heading, if no "Model Description" heading is found
    const firstHeadingMatch = readmeText.match(
      /(?:^|\n)##?\s*[^#\n]+[\r\n]+([\s\S]*?)(?:[\r\n]+\s*#|$)/
    );
    const description =
      firstHeadingMatch && firstHeadingMatch[1]
        ? firstHeadingMatch[1].trim()
        : "";

    return description;
  } catch (error) {
    console.error(`Error fetching README for ${repo.id}:`, error);
    return "";
  }
}

function removeMarkdownLinks(str) {
  return str.replace(/\[(.*?)\]\((.*?)\)/g, "$1");
}

function truncateWithoutBreakingWords(str, n) {
  // Replace newlines with spaces
  str = str.replace(/\n/g, " ");

  // Remove markdown links
  str = removeMarkdownLinks(str);

  if (str.length <= n) {
    return str;
  }

  const firstSentenceEnd = str.indexOf(".");
  const firstSentence =
    firstSentenceEnd === -1 ? str : str.slice(0, firstSentenceEnd + 1);

  if (firstSentence.length <= n) {
    return firstSentence;
  }

  const truncatedStr = firstSentence.substr(0, n);
  const lastSpaceIndex = truncatedStr.lastIndexOf(" ");

  if (lastSpaceIndex === -1) {
    return truncatedStr + "...";
  }

  return truncatedStr.substr(0, lastSpaceIndex) + "...";
}
