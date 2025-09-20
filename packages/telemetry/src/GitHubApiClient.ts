import { GitHubRepoProperties } from "@roo-code/types"

/**
 * GitHub API client for fetching repository statistics
 */
export class GitHubApiClient {
	private readonly baseUrl = "https://api.github.com"
	private readonly token?: string
	private readonly owner: string
	private readonly repo: string

	constructor(owner: string, repo: string, token?: string) {
		this.owner = owner
		this.repo = repo
		this.token = token
	}

	/**
	 * Fetches repository information including stars, forks, watchers, and issues
	 */
	public async getRepositoryInfo(): Promise<GitHubRepoProperties> {
		const repoData = await this.fetchRepository()
		const [openPrCount, releasesTotal] = await Promise.all([
			this.getOpenPullRequestsCount(),
			this.getReleasesTotal(),
		])

		return {
			stars_count: repoData.stargazers_count,
			forks_count: repoData.forks_count,
			watchers_count: repoData.watchers_count,
			open_issues_count: repoData.open_issues_count,
			open_pr_count: openPrCount,
			releases_total: releasesTotal,
		}
	}

	/**
	 * Fetches basic repository information
	 */
	private async fetchRepository(): Promise<{
		stargazers_count: number
		forks_count: number
		watchers_count: number
		open_issues_count: number
	}> {
		const response = await this.makeRequest(`/repos/${this.owner}/${this.repo}`)

		if (!response.ok) {
			throw new Error(`Failed to fetch repository: ${response.status} ${response.statusText}`)
		}

		return response.json()
	}

	/**
	 * Gets the count of open pull requests
	 */
	private async getOpenPullRequestsCount(): Promise<number> {
		const response = await this.makeRequest(`/repos/${this.owner}/${this.repo}/pulls?state=open&per_page=1`)

		if (!response.ok) {
			// If we can't fetch PRs, return 0
			return 0
		}

		// GitHub returns the total count in the Link header
		const linkHeader = response.headers.get("Link")
		if (linkHeader) {
			const match = linkHeader.match(/page=(\d+)&per_page=1>; rel="last"/)
			if (match) {
				return parseInt(match[1], 10)
			}
		}

		// Fallback: count the actual PRs returned
		const prs = await response.json()
		return Array.isArray(prs) ? prs.length : 0
	}

	/**
	 * Gets the total number of releases
	 */
	private async getReleasesTotal(): Promise<number> {
		const response = await this.makeRequest(`/repos/${this.owner}/${this.repo}/releases?per_page=1`)

		if (!response.ok) {
			// If we can't fetch releases, return 0
			return 0
		}

		// GitHub returns the total count in the Link header
		const linkHeader = response.headers.get("Link")
		if (linkHeader) {
			const match = linkHeader.match(/page=(\d+)&per_page=1>; rel="last"/)
			if (match) {
				return parseInt(match[1], 10)
			}
		}

		// Fallback: count the actual releases returned
		const releases = await response.json()
		return Array.isArray(releases) ? releases.length : 0
	}

	/**
	 * Makes an authenticated request to the GitHub API
	 */
	private async makeRequest(endpoint: string): Promise<Response> {
		const headers: Record<string, string> = {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
		}

		if (this.token) {
			headers.Authorization = `Bearer ${this.token}`
		}

		return fetch(`${this.baseUrl}${endpoint}`, {
			headers,
		})
	}

	/**
	 * Checks if the API client is properly configured
	 */
	public isConfigured(): boolean {
		return Boolean(this.owner && this.repo)
	}

	/**
	 * Gets the repository identifier
	 */
	public getRepositoryId(): string {
		return `${this.owner}/${this.repo}`
	}
}
