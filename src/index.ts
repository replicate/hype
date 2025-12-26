import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ListPosts, GetLastUpdated } from "./endpoints/posts";
import { updateContent } from "./scheduled";
import { getSupabase } from "./supabase";
import { renderPage } from "./html";
import { timeSince } from "./utils";

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
	if (err instanceof ApiException) {
		return c.json(
			{ success: false, errors: err.buildResponse() },
			err.status as ContentfulStatusCode
		);
	}
	console.error("Error:", err);
	return c.json({ success: false, errors: [{ code: 7000, message: "Internal Server Error" }] }, 500);
});

// HTML page route
app.get("/", async (c) => {
	const filter = c.req.query("filter") || "past_week";
	const sourcesParam = c.req.query("sources") || "GitHub,HuggingFace,Reddit,Replicate";
	const sources = sourcesParam.split(",");

	const supabase = getSupabase(c.env);

	const now = new Date();
	const fromDate = new Date();
	if (filter === "past_day") fromDate.setDate(now.getDate() - 1);
	else if (filter === "past_three_days") fromDate.setDate(now.getDate() - 3);
	else fromDate.setDate(now.getDate() - 7);

	console.log("Query params:", { filter, sources: sources.map((s) => s.toLowerCase()), fromDate: fromDate.toISOString() });

	const { data: posts, error } = await supabase
		.from("repositories")
		.select("*")
		.order("stars", { ascending: false })
		.limit(500)
		.in("source", sources.map((s) => s.toLowerCase()))
		.gt("created_at", fromDate.toISOString())
		.gt("inserted_at", fromDate.toISOString());

	console.log("Supabase response:", { postCount: posts?.length, error, sample: posts?.[0] });

	const { data: lastUpdatedRaw } = await supabase.rpc("repositories_last_modified");
	const lastUpdated = lastUpdatedRaw ? `${timeSince(new Date(lastUpdatedRaw))} ago` : "";

	const filtered = (posts || []).filter((p: any) => {
		const name = p.name?.toLowerCase() || "";
		const desc = p.description?.toLowerCase() || "";
		const banned = ["nft", "crypto", "telegram", "clicker", "solana", "stealer"];
		if (!p.username?.trim()) return false;
		for (const s of banned) if (name.includes(s) || desc.includes(s)) return false;
		if (name.includes("stake") && name.includes("predict")) return false;
		return true;
	});

	console.log("After filtering:", { filteredCount: filtered.length });

	filtered.sort((a: any, b: any) => {
		const key = (p: any) =>
			p.source === "reddit" ? p.stars * 0.3 : p.source === "replicate" ? Math.pow(p.stars, 0.6) : p.stars;
		return key(b) - key(a);
	});

	return c.html(renderPage(filtered, filter, sources, lastUpdated), {
		headers: { "Cache-Control": "public, max-age=300" },
	});
});

// OpenAPI routes
const openapi = fromHono(app, {
	docs_url: "/docs",
	schema: {
		info: {
			title: "Hype API",
			version: "1.0.0",
			description: "ML/AI news aggregator API",
		},
	},
});

openapi.get("/api/posts", ListPosts);
openapi.get("/api/last-updated", GetLastUpdated);

// Manual update trigger
app.post("/api/update", async (c) => {
	await updateContent(c.env);
	return c.json({ success: true });
});

export default {
	fetch: app.fetch,
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(updateContent(env));
	},
};
