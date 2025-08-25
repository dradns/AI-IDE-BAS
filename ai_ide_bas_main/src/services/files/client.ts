import axios, { AxiosInstance } from "axios"
import FormData from "form-data"
import * as vscode from "vscode"

const BASE_URL = "https://api.aiidebas.com/api/v1"

export type FileItem = { id?: string; filename: string; public_url?: string | null; project?: string | null }

export class AiIdeBasFilesClient {
	private readonly http: AxiosInstance

	constructor(private readonly context: vscode.ExtensionContext) {
		this.http = axios.create({ baseURL: BASE_URL, timeout: 15_000 })

		this.http.interceptors.request.use(async (config) => {
			const token = await this.getToken()
			if (token) {
				config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
			}
			return config
		})

		this.http.interceptors.response.use(
			(r) => r,
			async (err) => {
				if (err?.response?.status === 401) {
					await this.logout()
				}
				throw err
			},
		)
	}

	private async getToken() {
		return await this.context.secrets.get("aiidebas.token")
	}

	public async isAuthorized(): Promise<boolean> {
		return Boolean(await this.getToken())
	}

	public getLoginUrl(state?: string): string {
		const cb = encodeURIComponent("vscode://8eton.ai-ide-bas/auth/callback")
		const s = state ? `&state=${encodeURIComponent(state)}` : ""
		return `https://api.aiidebas.com/api/v1/login?redirect_uri=${cb}${s}`
	}

	public async logout(): Promise<void> {
		await this.context.secrets.delete("aiidebas.token")
	}

	public async health(): Promise<{ status: string }> {
		const { data } = await this.http.get(`/health`)
		return data
	}

	public async listFiles(params?: { search?: string; page?: number; pageSize?: number; projectName?: string }): Promise<FileItem[]> {
		const qp: Record<string, any> = { ...params }
		if (params?.projectName) qp.project_name = params.projectName
		delete qp.projectName
		const { data } = await this.http.get(`/files`, { params: qp })
		return data?.items ?? data ?? []
	}

	public async uploadFile(filePath: string, projectName: string): Promise<FileItem> {
		const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))
		const name = filePath.split(/[\\/]/).pop() || "file"
		const form = new FormData()
		form.append("file", Buffer.from(bytes), name)
		form.append("project_name", projectName)
		const headers = form.getHeaders()
		const { data } = await this.http.post(`/files`, form, { headers })
		return data
	}

	public async downloadFile(idOrName: string, targetPath: string): Promise<void> {
		const { data } = await this.http.get(`/files/${encodeURIComponent(idOrName)}`, { responseType: "arraybuffer" })
		await vscode.workspace.fs.writeFile(vscode.Uri.file(targetPath), new Uint8Array(data))
	}

	public async deleteFile(fileId: string): Promise<void> {
		await this.http.delete(`/files/${encodeURIComponent(fileId)}`)
	}

	public async shareProject(projectName: string, visibility: "private" | "public" | "org"): Promise<{ url: string }> {
		const { data } = await this.http.post(`/projects/${encodeURIComponent(projectName)}/share`, { visibility })
		return data
	}
}


