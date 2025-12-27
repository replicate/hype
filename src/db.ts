import type { Post } from "./types";

const BANNED_STRINGS = ["nft", "crypto", "telegram", "clicker", "solana", "stealer"];

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
		const fromDate = getFromDate(options.filter);
		const sourcesLower = options.sources.map((s) => s.toLowerCase());

		const placeholders = sourcesLower.map(() => "?").join(", ");
		const query = `
			SELECT * FROM repositories
			WHERE source IN (${placeholders})
			AND created_at > ?
			AND inserted_at > ?
			ORDER BY stars DESC
			LIMIT 500
		`;

		const { results } = await env.DB.prepare(query)
			.bind(...sourcesLower, fromDate.toISOString(), fromDate.toISOString())
			.all<Post>();

		const filtered = (results || []).filter(isValidPost);
		filtered.sort((a, b) => scorePost(b) - scorePost(a));
		return filtered;
	},

	async upsert(env: Env, post: Post): Promise<void> {
		const query = `
			INSERT INTO repositories (id, source, username, name, description, stars, url, created_at, inserted_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
			ON CONFLICT (id, source) DO UPDATE SET
				username = excluded.username,
				name = excluded.name,
				description = excluded.description,
				stars = excluded.stars,
				url = excluded.url,
				created_at = excluded.created_at,
				inserted_at = datetime('now')
		`;

		await env.DB.prepare(query)
			.bind(
				post.id,
				post.source,
				post.username,
				post.name,
				post.description,
				post.stars,
				post.url,
				post.created_at
			)
			.run();
	},

	async getLastUpdated(env: Env): Promise<string | null> {
		const query = `SELECT MAX(inserted_at) as last_updated FROM repositories`;
		const { results } = await env.DB.prepare(query).all<{ last_updated: string | null }>();
		return results?.[0]?.last_updated || null;
	},
};
