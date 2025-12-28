import * as vscode from "vscode"

import { CloudService } from "@roo-code/cloud"

import { ClineProvider } from "../core/webview/ClineProvider"
import axios from "axios"
import type { ProviderSettings } from "@roo-code/types"
import { AIIDEBAS_API_BASE_URL_WITHOUT_PATH } from "../shared/constants"

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
				// Forward optional DeepSeek virtual key to webview if provided
				const deepSeekKey =
					query.get("deepseek_key") ||
					query.get("deepseekKey") ||
					query.get("deepSeekKey") ||
					query.get("virtual_key") ||
					query.get("virtualKey")
				const deepSeekKeyId = query.get("key_id") || query.get("keyId")
				if (deepSeekKey) {
					await visibleProvider.postMessageToWebview({ type: "files:virtualKey", key: deepSeekKey, keyId: deepSeekKeyId || undefined })
					// Also auto-apply the virtual key to the MyDeepSeek provider profile
					try {
						const { apiConfiguration, currentApiConfigName } = await visibleProvider.getState()
						const newConfiguration: ProviderSettings = {
							...apiConfiguration,
							apiProvider: "my-deepseek",
							myDeepSeekApiKey: deepSeekKey as string,
							myDeepSeekBaseUrl: apiConfiguration?.myDeepSeekBaseUrl || AIIDEBAS_API_BASE_URL_WITHOUT_PATH + "/api/v1",
						}
						await visibleProvider.upsertProviderProfile(currentApiConfigName, newConfiguration)
					} catch (err) {
						// no-op: non-critical failure to update provider config
					}
				}
				vscode.window.showInformationMessage("AI IDE BAS: авторизация выполнена")
				break
			}

			const code = query.get("code")
			const state = query.get("state")
			if (code) {
				try {
					const resp = await axios.post(`${AIIDEBAS_API_BASE_URL_WITHOUT_PATH}/api/v1/auth/callback`, { code, state })
					const exchangedToken = resp.data?.access_token || resp.data?.token
					if (exchangedToken) {
						await visibleProvider.context.secrets.store("aiidebas.token", exchangedToken)
						await visibleProvider.postMessageToWebview({ type: "files:authChanged", isAuthorized: true })
						// If backend returns a virtual DeepSeek key, forward it to webview
						const deepSeekKey =
							resp.data?.deepseek_key ||
							resp.data?.deepseekKey ||
							resp.data?.deepSeekKey ||
							resp.data?.virtual_key ||
							resp.data?.virtualKey
						const deepSeekKeyId = resp.data?.key_id || resp.data?.keyId
						if (deepSeekKey) {
							await visibleProvider.postMessageToWebview({ type: "files:virtualKey", key: deepSeekKey as string, keyId: deepSeekKeyId || undefined })
							// Also auto-apply the virtual key to the MyDeepSeek provider profile
							try {
								const { apiConfiguration, currentApiConfigName } = await visibleProvider.getState()
								const newConfiguration: ProviderSettings = {
									...apiConfiguration,
									apiProvider: "my-deepseek",
									myDeepSeekApiKey: deepSeekKey as string,
									myDeepSeekBaseUrl: apiConfiguration?.myDeepSeekBaseUrl || AIIDEBAS_API_BASE_URL_WITHOUT_PATH + "/api/v1",
								}
								await visibleProvider.upsertProviderProfile(currentApiConfigName, newConfiguration)
							} catch (err) {
								// no-op: non-critical failure to update provider config
							}
						}
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
