import axios from "axios";
import Replicate from "replicate";
import supabase from "./supabase";
import { convertModelRunsToStars } from "./utils";

const replicate = new Replicate({
  // get your token from https://replicate.com/account
  auth: process.env.REPLICATE_API_TOKEN, // defaults to process.env.REPLICATE_API_TOKEN
});

const BigInteger = require("biginteger").BigInteger;

class Post {
  constructor(id, source, username, name, stars, description, url, created_at) {
    this.id = id;
    this.source = source;
    this.username = username;
    this.name = name;
    this.stars = stars;
    this.description = description;
    this.url = url;
    this.created_at = created_at;
  }
}

async function fetchReplicatePosts() {
  const posts = [];
  const limit = 1000;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  loop:
  for await (const batch of replicate.paginate(replicate.models.list)) {
    if (posts.length >= limit) break;

    for (const model of batch) {
      if (model.latest_version == null || model.latest_version.id == null || model.run_count <= 1) continue;

      if (new Date(model.latest_version.created_at) < oneWeekAgo) {
        break loop;
      }

      const modelHashInt = hashStringToInt(model.url).toString();

      const post = new Post(
        modelHashInt,
        "replicate",
        model.owner,
        model.name,
        model.run_count,
        model.description,
        model.url,
        model.created_at
      );
      posts.push(post);
    }
  }

  console.log(`Uploaded ${posts.length} replicate models`); // Log after processing the batch

  return posts;
}

async function fetchHuggingFacePosts() {
  const huggingFaceReposResponse = await axios.get(
    `https://huggingface.co/api/models?full=true&limit=5000&sort=lastModified&direction=-1`
  );

  const huggingFaceRepos = huggingFaceReposResponse.data;
  const posts = [];

  for (const repo of huggingFaceRepos) {
    if (repo.likes <= 1 || repo.downloads <= 1 || !repo.author) continue;

    const repoIdInt = parseInt(repo._id.substring(10), 16);
    const description = await getHuggingFaceRepoDescription(repo);
    const truncatedDescription = truncateWithoutBreakingWords(description, 200);
    const post = new Post(
      repoIdInt,
      "huggingface",
      repo.author,
      repo.id.split("/")[1],
      repo.likes,
      truncatedDescription,
      `https://huggingface.co/${repo.id}`,
      repo.lastModified
    );
    posts.push(post);
  }
  return posts;
}

async function fetchGitHubPosts(lastWeekDate) {
  const posts = [];
  for (let page = 1; page <= 5; page++) {
    const response = await axios.get(
      `https://api.github.com/search/repositories?q=language:python+created:>${lastWeekDate}&sort=stars&order=desc&per_page=100&page=${page}`
    );

    const repos = response.data.items;
    for (const repo of repos) {
      const post = new Post(
        repo.id,
        "github",
        repo.owner.login,
        repo.name,
        repo.stargazers_count,
        repo.description,
        repo.html_url,
        repo.created_at
      );
      posts.push(post);
    }
  }
  return posts;
}

export async function fetchRedditPosts() {
  const subreddits = ["machinelearning", "localllama", "StableDiffusion"];
  const flairFilters = { "StableDiffusion": ["News", "Resource | Update"] }
  const redditBaseURL = "https://www.reddit.com/r";
  const posts = [];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  for (const subreddit of subreddits) {
    try {
      const response = await axios.get(
        `${redditBaseURL}/${subreddit}/top.json?sort=top&t=week&limit=100`,
        {
          headers: {
            "User-Agent": "news.replicate.dev",
          },
        }
      );

      const threads = response.data.data.children;

      for (const thread of threads) {
        const { title, author, subreddit, score, created_utc, id, permalink, link_flair_text } =
          thread.data;

        const flairFilter = flairFilters[subreddit];
        if (flairFilter && !flairFilter.includes(link_flair_text)) {
          continue
        }

        const redditPost = new Post(
          BigInteger.parse(id, 36).toString(),
          "reddit",
          author,
          title,
          score,
          `/r/${subreddit}`,
          `https://www.reddit.com${permalink}`,
          new Date(created_utc * 1000).toISOString()
        );
        posts.push(redditPost);
      }
    } catch (error) {
      console.error(
        `Error fetching top posts from subreddit ${subreddit}:`,
        error
      );
    }
  }

  return posts;
}

export async function getContent(
  filter = "all",
  sources = ["github", "huggingface", "reddit", "replicate"]
) {
  sources = sources.map((s) => s.toLowerCase());

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
    .limit(500)
    .in("source", sources);

  let fromDate;
  if (filter === "past_day") {
    fromDate = oneDayAgo;
  } else if (filter === "past_three_days") {
    fromDate = threeDaysAgo;
  } else {
    fromDate = sevenDaysAgo;
  }
  query = query
    .gt("created_at", fromDate.toISOString())
    .gt("inserted_at", fromDate.toISOString()); // hf doesn't expose created_at

  const { data: posts, error } = await query;

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }

  const filteredPosts = posts.filter(
    (post) => post.username && post.username.trim() !== ""
  );

  filteredPosts.sort(customPostSort);

  return filteredPosts;
}

function customPostSort(p1, p2) {
  const key = (p) =>
    p.source == "reddit"
      ? p.stars * 0.3
      : p.source == "replicate"
        ? Math.pow(p.stars, 0.6)
        : p.stars;
  return key(p2) - key(p1);
}

export async function updateContent() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const lastWeekDate = date.toISOString().slice(0, 10);

  const [huggingFacePosts, gitHubPosts, redditPosts, replicatePosts] = await Promise.all([
    fetchHuggingFacePosts(),
    fetchGitHubPosts(lastWeekDate),
    fetchRedditPosts(),
    fetchReplicatePosts(lastWeekDate),
  ]);

  const posts = [
    ...huggingFacePosts,
    ...gitHubPosts,
    ...redditPosts,
    ...replicatePosts,
  ];

  for (const post of posts) {
    const { error } = await supabase.from("repositories").upsert(
      {
        id: post.id,
        source: post.source,
        username: post.username,
        name: post.name,
        description: post.description,
        stars: post.stars,
        url: post.url,
        created_at: post.created_at,
      },
      { onConflict: ["id", "source"] } // Specify the primary key for conflict resolution
    );

    if (error) {
      console.error(`Error upserting post ${post.id}:`, error);
    } else {
      console.log(`Successfully upserted post ${post.id}`);
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

function hashStringToInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
