import * as vscode from "vscode"

import { CloudService } from "@roo-code/cloud"

import { ClineProvider } from "../core/webview/ClineProvider"
import axios from "axios"

export const handleUri = async (uri: vscode.Uri) => {
	const path = uri.path
	const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))
	const visibleProvider = ClineProvider.getVisibleInstance()

	if (!visibleProvider) {
		return
	}

	switch (path) {
		case "/glama": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleGlamaCallback(code)
			}
			break
		}
		case "/openrouter": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleOpenRouterCallback(code)
			}
			break
		}
		case "/requesty": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleRequestyCallback(code)
			}
			break
		}
		case "/auth/clerk/callback": {
			const code = query.get("code")
			const state = query.get("state")
			const organizationId = query.get("organizationId")

			await CloudService.instance.handleAuthCallback(
				code,
				state,
				organizationId === "null" ? null : organizationId,
			)
			break
		}
		case "/auth/callback": {
			const token = query.get("token")
			if (token) {
				await visibleProvider.context.secrets.store("aiidebas.token", token)
				await visibleProvider.postMessageToWebview({ type: "files:authChanged", isAuthorized: true })
				vscode.window.showInformationMessage("AI IDE BAS: авторизация выполнена")
				break
			}

			const code = query.get("code")
			const state = query.get("state")
			if (code) {
				try {
					const resp = await axios.post("https://api.aiidebas.com/api/v1/auth/callback", { code, state })
					const exchangedToken = resp.data?.access_token || resp.data?.token
					if (exchangedToken) {
						await visibleProvider.context.secrets.store("aiidebas.token", exchangedToken)
						await visibleProvider.postMessageToWebview({ type: "files:authChanged", isAuthorized: true })
						vscode.window.showInformationMessage("AI IDE BAS: авторизация выполнена")
					} else {
						vscode.window.showErrorMessage("AI IDE BAS: не удалось получить токен")
					}
				} catch (e) {
					vscode.window.showErrorMessage("AI IDE BAS: ошибка авторизации")
				}
			}
			break
		}
		default:
			break
	}
}
