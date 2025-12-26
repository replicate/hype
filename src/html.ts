import Mustache from "mustache";
import type { Post } from "./types";
import PAGE_TEMPLATE from "./templates/page.html";

interface PostData {
	index: number;
	displayName: string;
	icon: string;
	description: string;
	url: string;
	stars: number;
}

interface PageData {
	filter: string;
	sourcesParam: string;
	lastUpdated: string;
	posts: PostData[];
	filterLinks: Array<{ key: string; label: string; active: boolean }>;
	sources: Array<{ name: string; checked: boolean }>;
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

export function renderPage(posts: Post[], filter: string, sources: string[], lastUpdated: string): string {
	const allSources = ["GitHub", "Replicate", "HuggingFace", "Reddit"];

	const filterLinks = [
		{ key: "past_day", label: "Past day" },
		{ key: "past_three_days", label: "Past three days" },
		{ key: "past_week", label: "Past week" },
	].map((f, i) => ({
		...f,
		active: filter === f.key || (!filter && f.key === "past_week"),
		first: i === 0,
	}));

	const data: PageData = {
		filter: filter || "past_week",
		sourcesParam: sources.join(","),
		lastUpdated,
		posts: posts.map(preparePostData),
		filterLinks,
		sources: allSources.map((name) => ({
			name,
			checked: sources.includes(name),
		})),
	};

	return Mustache.render(PAGE_TEMPLATE, data);
}
