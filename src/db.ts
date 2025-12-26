import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Post } from "./types";

const BANNED_STRINGS = ["nft", "crypto", "telegram", "clicker", "solana", "stealer"];

function getClient(env: Env): SupabaseClient {
	return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

function isValidPost(post: Post): boolean {
	const name = post.name?.toLowerCase() || "";
	const desc = post.description?.toLowerCase() || "";
	if (!post.username?.trim()) return false;
	for (const s of BANNED_STRINGS) {
		if (name.includes(s) || desc.includes(s)) return false;
	}
	if (name.includes("stake") && name.includes("predict")) return false;
	return true;
}

function scorePost(post: Post): number {
	if (post.source === "reddit") return post.stars * 0.3;
	if (post.source === "replicate") return Math.pow(post.stars, 0.6);
	return post.stars;
}

export type FilterType = "past_day" | "past_three_days" | "past_week";

function getFromDate(filter: FilterType): Date {
	const now = new Date();
	const fromDate = new Date();
	if (filter === "past_day") fromDate.setDate(now.getDate() - 1);
	else if (filter === "past_three_days") fromDate.setDate(now.getDate() - 3);
	else fromDate.setDate(now.getDate() - 7);
	return fromDate;
}

export const posts = {
	async query(env: Env, options: { filter: FilterType; sources: string[] }): Promise<Post[]> {
		const client = getClient(env);
		const fromDate = getFromDate(options.filter);
		const sourcesLower = options.sources.map((s) => s.toLowerCase());

		const { data, error } = await client
			.from("repositories")
			.select("*")
			.order("stars", { ascending: false })
			.limit(500)
			.in("source", sourcesLower)
			.gt("created_at", fromDate.toISOString())
			.gt("inserted_at", fromDate.toISOString());

		if (error) throw new Error(`Database error: ${error.message}`);

		const filtered = (data || []).filter(isValidPost);
		filtered.sort((a, b) => scorePost(b) - scorePost(a));
		return filtered;
	},

	async upsert(env: Env, post: Post): Promise<void> {
		const client = getClient(env);
		const { error } = await client.from("repositories").upsert(
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
		if (error) throw new Error(`Database error upserting ${post.id}: ${error.message}`);
	},

	async getLastUpdated(env: Env): Promise<string | null> {
		const client = getClient(env);
		const { data } = await client.rpc("repositories_last_modified");
		return data || null;
	},
};
