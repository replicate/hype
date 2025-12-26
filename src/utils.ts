export function timeSince(date: Date): string {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

	let interval = seconds / 31536000;
	if (interval > 1) return Math.floor(interval) + " years";

	interval = seconds / 2592000;
	if (interval > 1) return Math.floor(interval) + " months";

	interval = seconds / 86400;
	if (interval > 1) return Math.floor(interval) + " days";

	interval = seconds / 3600;
	if (interval > 1) return Math.floor(interval) + " hours";

	interval = seconds / 60;
	if (interval > 1) return Math.floor(interval) + " minutes";

	return Math.floor(seconds) + " seconds";
}

export function hashStringToInt(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return hash;
}

export function truncateWithoutBreakingWords(str: string, n: number): string {
	str = str.replace(/\n/g, " ");
	str = str.replace(/\[(.*?)\]\((.*?)\)/g, "$1");

	if (str.length <= n) return str;

	const firstSentenceEnd = str.indexOf(".");
	const firstSentence = firstSentenceEnd === -1 ? str : str.slice(0, firstSentenceEnd + 1);

	if (firstSentence.length <= n) return firstSentence;

	const truncatedStr = firstSentence.substr(0, n);
	const lastSpaceIndex = truncatedStr.lastIndexOf(" ");

	return lastSpaceIndex === -1 ? truncatedStr + "..." : truncatedStr.substr(0, lastSpaceIndex) + "...";
}

export function base36ToInt(str: string): string {
	let result = BigInt(0);
	for (const char of str) {
		const digit = parseInt(char, 36);
		result = result * BigInt(36) + BigInt(digit);
	}
	return result.toString();
}
