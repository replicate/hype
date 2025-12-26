import Mustache from "mustache";
import type { Post } from "./types";

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

const PAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Hype - ML/AI News</title>
	<script src="https://cdn.tailwindcss.com"></script>
	<style>
		body { font-family: Verdana, Geneva, sans-serif; }
	</style>
</head>
<body class="container mx-auto overflow-x-hidden">
	<main class="md:px-4">
		<div class="flex justify-between items-center bg-red-600 px-4 py-2">
			<a href="/" class="text-white font-bold hover:underline text-md rotate-[-5deg]">Hype</a>
			<a href="https://github.com/andreasjansson/python-repos#readme" class="text-white ml-4 hover:underline text-[0.9rem]" target="_blank">What is this?</a>
			<div class="flex items-center ml-auto">
				{{#filterLinks}}
				{{^first}}<span class="text-white sm:mx-4 mx-1">|</span>{{/first}}
				<a href="/?filter={{key}}&sources={{sourcesParam}}" class="text-[0.9rem] text-white {{#active}}underline{{/active}}" data-navigate>{{label}}</a>
				{{/filterLinks}}
			</div>
		</div>

		<div class="text-xs flex justify-between items-center bg-[#f6f6ef] px-4 py-1">
			<div class="flex items-center space-x-4">
				{{#sources}}
				<label class="inline-flex items-center cursor-pointer">
					<input type="checkbox" class="form-checkbox accent-gray-600" data-source="{{name}}" {{#checked}}checked{{/checked}}>
					<span class="ml-2">{{name}}</span>
				</label>
				{{/sources}}
			</div>
			<span class="text-gray-500">Last updated {{lastUpdated}}</span>
		</div>

		<ul class="bg-gray-100 relative">
			{{#posts}}
			<li class="flex py-1 bg-[#f6f6ef]">
				<span class="w-8 text-right mr-2 text-gray-600">{{index}}.</span>
				<div class="flex flex-col w-full">
					<div class="flex items-center">
						<a href="{{url}}" target="_blank" rel="noopener noreferrer" class="text-black text-[0.9rem]">{{displayName}}</a>
						<span class="text-gray-600 text-xs ml-2">{{icon}}</span>
						<span class="text-gray-600 text-xs ml-1">{{stars}}</span>
					</div>
					<p class="text-gray-600 text-xs mt-0.5">{{description}}</p>
				</div>
			</li>
			{{/posts}}
		</ul>
	</main>

	<footer class="flex justify-center items-center py-4 border-t-2 border-red-600 md:mx-4">
		<a href="https://replicate.com" class="text-gray-600 text-sm hover:underline">Built by Replicate</a>
		<span class="md:mx-4">|</span>
		<a href="https://github.com/andreasjansson/python-repos" target="_blank" rel="noopener noreferrer" class="text-gray-600 text-sm hover:underline">Fork me on GitHub</a>
	</footer>

	<script>
		const currentFilter = "{{filter}}";

		function getSelectedSources() {
			return [...document.querySelectorAll('[data-source]:checked')].map(c => c.dataset.source);
		}

		function buildUrl(filter, sources) {
			return '/?filter=' + filter + '&sources=' + sources.join(',');
		}

		async function navigate(url) {
			document.querySelectorAll('[data-source]').forEach(cb => {
				cb.disabled = true;
				cb.parentElement.style.opacity = '0.5';
			});
			history.pushState(null, '', url);
			const res = await fetch(url);
			const html = await res.text();
			const doc = new DOMParser().parseFromString(html, 'text/html');
			document.body.innerHTML = doc.body.innerHTML;
			attachListeners();
		}

		function attachListeners() {
			document.querySelectorAll('[data-source]').forEach(cb => {
				cb.addEventListener('change', () => {
					navigate(buildUrl(currentFilter, getSelectedSources()));
				});
			});
			document.querySelectorAll('[data-navigate]').forEach(a => {
				a.addEventListener('click', (e) => {
					e.preventDefault();
					navigate(a.href);
				});
			});
		}

		window.addEventListener('popstate', () => navigate(location.href));
		attachListeners();
	</script>
</body>
</html>`;

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
