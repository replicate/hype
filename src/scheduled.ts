import { posts } from "./db";
import { fetchGitHubPosts, fetchHuggingFacePosts, fetchRedditPosts, fetchReplicatePosts } from "./fetchers";
import type { Post } from "./types";

export async function updateContent(env: Env): Promise<void> {
	const date = new Date();
	date.setDate(date.getDate() - 7);
	const lastWeekDate = date.toISOString().slice(0, 10);

	const [huggingFacePosts, gitHubPosts, redditPosts, replicatePosts] = await Promise.all([
		fetchHuggingFacePosts(),
		fetchGitHubPosts(lastWeekDate),
		fetchRedditPosts(),
		fetchReplicatePosts(env),
	]);

	const allPosts: Post[] = [...huggingFacePosts, ...gitHubPosts, ...redditPosts, ...replicatePosts];

	for (const post of allPosts) {
		try {
			await posts.upsert(env, post);
			console.log(`Upserted post ${post.id}`);
		} catch (err) {
			console.error(`Error upserting post ${post.id}:`, err);
		}
	}

	console.log(`Updated ${allPosts.length} posts total`);
}
