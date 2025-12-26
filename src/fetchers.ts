import Replicate from "replicate";
import type { Post } from "./types";
import { hashStringToInt, truncateWithoutBreakingWords, base36ToInt } from "./utils";

export async function fetchReplicatePosts(env: Env): Promise<Post[]> {
	const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
	const posts: Post[] = [];
	const limit = 1000;
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	outer: for await (const batch of replicate.paginate(replicate.models.list)) {
		if (posts.length >= limit) break;

		for (const model of batch) {
			if (!model.latest_version?.id || model.run_count <= 1) continue;
			if (new Date(model.latest_version.created_at) < oneWeekAgo) break outer;

			posts.push({
				id: hashStringToInt(model.url).toString(),
				source: "replicate",
				username: model.owner,
				name: model.name,
				stars: model.run_count,
				description: model.description || "",
				url: model.url,
				created_at: model.created_at,
			});
		}
	}

	console.log(`Fetched ${posts.length} replicate models`);
	return posts;
}

export async function fetchHuggingFacePosts(): Promise<Post[]> {
	const resp = await fetch(
		"https://huggingface.co/api/models?full=true&limit=5000&sort=lastModified&direction=-1"
	);
	const repos = (await resp.json()) as any[];
	const posts: Post[] = [];

	for (const repo of repos) {
		if (repo.likes <= 1 || repo.downloads <= 1 || !repo.author) continue;

		const repoIdInt = parseInt(repo._id.substring(10), 16);
		const description = await getHuggingFaceRepoDescription(repo);

		posts.push({
			id: repoIdInt.toString(),
			source: "huggingface",
			username: repo.author,
			name: repo.id.split("/")[1],
			stars: repo.likes,
			description: truncateWithoutBreakingWords(description, 200),
			url: `https://huggingface.co/${repo.id}`,
			created_at: repo.lastModified,
		});
	}

	console.log(`Fetched ${posts.length} huggingface models`);
	return posts;
}

async function getHuggingFaceRepoDescription(repo: any): Promise<string> {
	const readmeFilename = repo.siblings?.find(
		(s: any) => s.rfilename.toLowerCase() === "readme.md"
	)?.rfilename;

	if (!readmeFilename) return "";

	try {
		const resp = await fetch(`https://huggingface.co/${repo.id}/raw/main/${readmeFilename}`);
		const readmeText = await resp.text();

		const modelDescMatch = readmeText.match(
			/(?:^|\n)##\s*(?:Model [Dd]escription|Overview:?)[\r\n]+([\s\S]*?)(?:[\r\n]+\s*#|$)/
		);
		if (modelDescMatch?.[1]) return modelDescMatch[1].trim();

		const firstHeadingMatch = readmeText.match(
			/(?:^|\n)##?\s*[^#\n]+[\r\n]+([\s\S]*?)(?:[\r\n]+\s*#|$)/
		);
		return firstHeadingMatch?.[1]?.trim() || "";
	} catch {
		return "";
	}
}

export async function fetchGitHubPosts(lastWeekDate: string): Promise<Post[]> {
	const posts: Post[] = [];

	for (let page = 1; page <= 5; page++) {
		const resp = await fetch(
			`https://api.github.com/search/repositories?q=language:python+created:>${lastWeekDate}&sort=stars&order=desc&per_page=100&page=${page}`,
			{ headers: { "User-Agent": "hype-news-aggregator" } }
		);
		const data = (await resp.json()) as any;

		for (const repo of data.items || []) {
			posts.push({
				id: repo.id.toString(),
				source: "github",
				username: repo.owner.login,
				name: repo.name,
				stars: repo.stargazers_count,
				description: repo.description || "",
				url: repo.html_url,
				created_at: repo.created_at,
			});
		}
	}

	console.log(`Fetched ${posts.length} github repos`);
	return posts;
}

export async function fetchRedditPosts(): Promise<Post[]> {
	const subreddits = ["machinelearning", "localllama", "StableDiffusion"];
	const flairFilters: Record<string, string[]> = {
		StableDiffusion: ["News", "Resource | Update"],
	};
	const posts: Post[] = [];

	for (const subreddit of subreddits) {
		try {
			const resp = await fetch(
				`https://www.reddit.com/r/${subreddit}/top.json?sort=top&t=week&limit=100`,
				{ headers: { "User-Agent": "hype-news-aggregator" } }
			);
			const data = (await resp.json()) as any;

			for (const thread of data.data?.children || []) {
				const { title, author, subreddit: sub, score, created_utc, id, permalink, link_flair_text } = thread.data;

				const flairFilter = flairFilters[sub];
				if (flairFilter && !flairFilter.includes(link_flair_text)) continue;

				posts.push({
					id: base36ToInt(id),
					source: "reddit",
					username: author,
					name: title,
					stars: score,
					description: `/r/${sub}`,
					url: `https://www.reddit.com${permalink}`,
					created_at: new Date(created_utc * 1000).toISOString(),
				});
			}
		} catch (err) {
			console.error(`Error fetching from r/${subreddit}:`, err);
		}
	}

	console.log(`Fetched ${posts.length} reddit posts`);
	return posts;
}
