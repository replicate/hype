import { getSupabase } from "./supabase";
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

	const posts: Post[] = [...huggingFacePosts, ...gitHubPosts, ...redditPosts, ...replicatePosts];
	const supabase = getSupabase(env);

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
			{ onConflict: "id,source" }
		);

		if (error) {
			console.error(`Error upserting post ${post.id}:`, error);
		} else {
			console.log(`Upserted post ${post.id}`);
		}
	}

	console.log(`Updated ${posts.length} posts total`);
}
