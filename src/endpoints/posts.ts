import { contentJson, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { posts, FilterType } from "../db";

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
		const sources = sourcesStr.split(",");

		const result = await posts.query(c.env, { filter: filter as FilterType, sources });
		return { success: true, result };
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
		const lastUpdated = await posts.getLastUpdated(c.env);
		return { success: true, result: { lastUpdated: lastUpdated || "" } };
	}
}
