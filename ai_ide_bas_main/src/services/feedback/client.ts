import axios, { AxiosInstance } from "axios"
import * as vscode from "vscode"

import { AIIDEBAS_API_BASE_URL } from "../../shared/constants"

const BASE_URL = AIIDEBAS_API_BASE_URL

export interface FeedbackCreate {
	rating: number // 1-5
	comment?: string | null // max 1000 chars
	session_id?: string | null // optional session identifier
}

export interface FeedbackResponse {
	id: string
	user_id: string
	rating: number
	comment?: string | null
	session_id?: string | null
	created_at: string
}

export class FeedbackClient {
	private readonly http: AxiosInstance

	constructor(private readonly context: vscode.ExtensionContext) {
		this.http = axios.create({ baseURL: BASE_URL, timeout: 15_000 })

		this.http.interceptors.request.use(async (config) => {
			const token = await this.getToken()
			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}
			return config
		})

		this.http.interceptors.response.use(
			(r) => r,
			async (err) => {
				// Allow 401 errors - feedback can be submitted without authentication
				// Just pass through the error for the caller to handle
				throw err
			},
		)
	}

	private async getToken(): Promise<string | undefined> {
		return await this.context.secrets.get("aiidebas.token")
	}

	public async isAuthorized(): Promise<boolean> {
		return Boolean(await this.getToken())
	}

	public async createFeedback(feedbackData: FeedbackCreate): Promise<FeedbackResponse> {
		const { data } = await this.http.post<FeedbackResponse>("/feedback/", feedbackData)
		return data
	}

	/**
	 * Create feedback without authentication token
	 * This allows anonymous feedback submission
	 */
	public async createFeedbackAnonymous(feedbackData: FeedbackCreate): Promise<FeedbackResponse> {
		// Create a new axios instance without interceptors that add token
		const anonymousHttp = axios.create({ baseURL: BASE_URL, timeout: 15_000 })
		const { data } = await anonymousHttp.post<FeedbackResponse>("/feedback/", feedbackData, {
			headers: {
				"Content-Type": "application/json",
			},
		})
		return data
	}
}

