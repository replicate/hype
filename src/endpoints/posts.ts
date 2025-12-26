import { contentJson, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { getSupabase } from "../supabase";

const PostSchema = z.object({
	id: z.string(),
	source: z.string(),
	username: z.string(),
	name: z.string(),
	stars: z.number(),
	description: z.string().nullable(),
	url: z.string(),
	created_at: z.string(),
});

const BANNED_STRINGS = ["nft", "crypto", "telegram", "clicker", "solana", "stealer"];

function filterPost(post: z.infer<typeof PostSchema>): boolean {
	const username = post.username;
	const name = post.name.toLowerCase();
	const description = post.description?.toLowerCase() || "";

	if (!username || username.trim() === "") return false;

	for (const s of BANNED_STRINGS) {
		if (name.includes(s) || description.includes(s)) return false;
	}

	if (name.includes("stake") && name.includes("predict")) return false;

	return true;
}

function customPostSort(p1: z.infer<typeof PostSchema>, p2: z.infer<typeof PostSchema>): number {
	const key = (p: z.infer<typeof PostSchema>) =>
		p.source === "reddit"
			? p.stars * 0.3
			: p.source === "replicate"
				? Math.pow(p.stars, 0.6)
				: p.stars;
	return key(p2) - key(p1);
}

export class ListPosts extends OpenAPIRoute {
	schema = {
		tags: ["Posts"],
		summary: "List posts from various sources",
		request: {
			query: z.object({
				filter: z.enum(["past_day", "past_three_days", "past_week"]).default("past_week"),
				sources: z.string().default("github,huggingface,reddit,replicate"),
			}),
		},
		responses: {
			"200": {
				description: "List of posts",
				...contentJson(z.object({
					success: z.boolean(),
					result: z.array(PostSchema),
				})),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { filter, sources: sourcesStr } = data.query;
		const sources = sourcesStr.split(",").map((s) => s.toLowerCase());

		const supabase = getSupabase(c.env);

		const now = new Date();
		const fromDate = new Date();
		if (filter === "past_day") fromDate.setDate(now.getDate() - 1);
		else if (filter === "past_three_days") fromDate.setDate(now.getDate() - 3);
		else fromDate.setDate(now.getDate() - 7);

		const { data: posts, error } = await supabase
			.from("repositories")
			.select("*")
			.order("stars", { ascending: false })
			.limit(500)
			.in("source", sources)
			.gt("created_at", fromDate.toISOString())
			.gt("inserted_at", fromDate.toISOString());

		if (error) throw new Error(`Supabase error: ${error.message}`);

		const filtered = (posts || []).filter(filterPost);
		filtered.sort(customPostSort);

		return { success: true, result: filtered };
	}
}

export class GetLastUpdated extends OpenAPIRoute {
	schema = {
		tags: ["Posts"],
		summary: "Get last updated timestamp",
		responses: {
			"200": {
				description: "Last updated timestamp",
				...contentJson(z.object({
					success: z.boolean(),
					result: z.object({ lastUpdated: z.string() }),
				})),
			},
		},
	};

	async handle(c: AppContext) {
		const supabase = getSupabase(c.env);
		const { data: lastUpdated } = await supabase.rpc("repositories_last_modified");
		return { success: true, result: { lastUpdated: lastUpdated || "" } };
	}
}
