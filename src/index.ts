import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import Mustache from "mustache";
import { ListPosts, GetLastUpdated } from "./endpoints/posts";
import { updateContent } from "./scheduled";
import { posts, FilterType } from "./db";
import type { Post } from "./types";
import PAGE_TEMPLATE from "./templates/page.html";

const ALL_SOURCES = ["GitHub", "Replicate", "HuggingFace", "Reddit"];

interface PostData {
  index: number;
  displayName: string;
  icon: string;
  description: string;
  url: string;
  stars: number;
}

function preparePostData(post: Post, index: number): PostData {
  const isRepo = post.source === "huggingface" || post.source === "github" || post.source === "replicate";
  const displayName = isRepo ? `${post.username}/${post.name}` : post.name;
  const icon = post.source === "huggingface" ? "🤗" : post.source === "reddit" ? "👽" : post.source === "replicate" ? "®️" : "⭐";
  const description = isRepo ? post.description : `${post.username} on ${post.description}`;

  return {
    index: index + 1,
    displayName,
    icon,
    description: description || "",
    url: post.url,
    stars: post.stars,
  };
}

function renderPage(postList: Post[], filter: string, sources: string[], lastUpdatedTimestamp: number | null): string {
  const filterLinks = [
    { key: "past_day", label: "Past day" },
    { key: "past_three_days", label: "Past three days" },
    { key: "past_week", label: "Past week" },
  ].map((f, i) => ({
    ...f,
    active: filter === f.key || (!filter && f.key === "past_week"),
    first: i === 0,
  }));

  return Mustache.render(PAGE_TEMPLATE, {
    filter: filter || "past_week",
    sourcesParam: sources.join(","),
    lastUpdatedTimestamp,
    posts: postList.map(preparePostData),
    filterLinks,
    sources: ALL_SOURCES.map((name) => ({
      name,
      checked: sources.includes(name),
    })),
  });
}

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

app.get("/", async (c) => {
  const filter = (c.req.query("filter") || "past_week") as FilterType;
  const sourcesParam = c.req.query("sources") || "GitHub,HuggingFace,Reddit,Replicate";
  const sources = sourcesParam.split(",");

  const [postList, lastUpdatedRaw] = await Promise.all([
    posts.query(c.env, { filter, sources }),
    posts.getLastUpdated(c.env),
  ]);

  const lastUpdatedTimestamp = lastUpdatedRaw ? new Date(lastUpdatedRaw).getTime() : null;

  return c.html(renderPage(postList, filter, sources, lastUpdatedTimestamp), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
});

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
