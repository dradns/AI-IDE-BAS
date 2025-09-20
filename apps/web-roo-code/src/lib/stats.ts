export async function getGitHubStars(): Promise<string> {
	// Always return static value to avoid build-time errors
	console.log("Using static value for GitHub stars")
	return "1k+"
}

export async function getVSCodeReviews(): Promise<
	Array<{ name: string; rating: number; content: string; date: string }>
> {
	// Always return static value to avoid build-time errors
	console.log("Using static value for VSCode reviews")
	return []
}

export async function getVSCodeDownloads(): Promise<string> {
	// Always return static value to avoid build-time errors
	console.log("Using static value for VSCode downloads")
	return "10k+"
}

// function formatNumber(num: number): string {
// 	// divide by 1000 to convert to "thousands" format,
// 	// multiply by 10, floor the result, then divide by 10 to keep one decimal place.
// 	const truncated = Math.floor((num / 1000) * 10) / 10
// 	// ensure one decimal is always shown and append "k"
// 	return truncated.toFixed(1) + "k"

// 	// examples:
// 	// console.log(formatNumber(337231)) -> "337.2k"
// 	// console.log(formatNumber(23233)) -> "23.2k"
// 	// console.log(formatNumber(2322)) -> "2.3k"
// 	// console.log(formatNumber(212)) -> "0.2k"
// }
