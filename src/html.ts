import type { Post } from "./types";

function postRow(post: Post, index: number): string {
	const isRepo = post.source === "huggingface" || post.source === "github" || post.source === "replicate";
	const displayName = isRepo ? `${post.username}/${post.name}` : post.name;
	const icon = post.source === "huggingface" ? "🤗" : post.source === "reddit" ? "👽" : post.source === "replicate" ? "®️" : "⭐";
	const desc = isRepo ? post.description : `${post.username} on ${post.description}`;

	return `<li class="flex py-1 bg-[#f6f6ef]">
		<span class="w-8 text-right mr-2 text-gray-600">${index + 1}.</span>
		<div class="flex flex-col w-full">
			<div class="flex items-center">
				<a href="${post.url}" target="_blank" rel="noopener noreferrer" class="text-black text-[0.9rem]">${escapeHtml(displayName)}</a>
				<span class="text-gray-600 text-xs ml-2">${icon}</span>
				<span class="text-gray-600 text-xs ml-1">${post.stars}</span>
			</div>
			<p class="text-gray-600 text-xs mt-0.5">${escapeHtml(desc || "")}</p>
		</div>
	</li>`;
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderPage(posts: Post[], filter: string, sources: string[], lastUpdated: string): string {
	const filterLinks = [
		{ key: "past_day", label: "Past day" },
		{ key: "past_three_days", label: "Past three days" },
		{ key: "past_week", label: "Past week" },
	];

	const allSources = ["GitHub", "Replicate", "HuggingFace", "Reddit"];

	return `<!DOCTYPE html>
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
				${filterLinks.map((f, i) => `
					${i > 0 ? '<span class="text-white sm:mx-4 mx-1">|</span>' : ''}
					<a href="/?filter=${f.key}&sources=${sources.join(",")}" class="text-[0.9rem] text-white ${filter === f.key || (!filter && f.key === "past_week") ? "underline" : ""}" data-navigate>${f.label}</a>
				`).join("")}
			</div>
		</div>

		<div class="text-xs flex justify-between items-center bg-[#f6f6ef] px-4 py-1">
			<div class="flex items-center space-x-4">
				${allSources.map((source) => `
					<label class="inline-flex items-center cursor-pointer">
						<input type="checkbox" class="form-checkbox accent-gray-600" data-source="${source}" ${sources.includes(source) ? "checked" : ""}>
						<span class="ml-2">${source}</span>
					</label>
				`).join("")}
			</div>
			<span class="text-gray-500">Last updated ${escapeHtml(lastUpdated)}</span>
		</div>

		<ul class="bg-gray-100 relative">
			${posts.map((post, i) => postRow(post, i)).join("")}
		</ul>
	</main>

	<footer class="flex justify-center items-center py-4 border-t-2 border-red-600 md:mx-4">
		<a href="https://replicate.com" class="text-gray-600 text-sm hover:underline">Built by Replicate</a>
		<span class="md:mx-4">|</span>
		<a href="https://github.com/andreasjansson/python-repos" target="_blank" rel="noopener noreferrer" class="text-gray-600 text-sm hover:underline">Fork me on GitHub</a>
	</footer>

	<script>
		const currentFilter = "${filter || "past_week"}";

		function getSelectedSources() {
			return [...document.querySelectorAll('[data-source]:checked')].map(c => c.dataset.source);
		}

		function buildUrl(filter, sources) {
			return '/?filter=' + filter + '&sources=' + sources.join(',');
		}

		async function navigate(url) {
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
}
