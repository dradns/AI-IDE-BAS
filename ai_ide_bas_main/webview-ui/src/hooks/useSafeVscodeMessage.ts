import { useEffect } from "react"
import type { DependencyList } from "react"

import { vscode } from "@src/utils/vscode"

/**
 * Безопасная отправка однотипного status-сообщения в VS Code host.
 * Хук повторно срабатывает при изменении переданных зависимостей.
 */
export const useStatusMessage = (type: string, deps: DependencyList = []) => {
	useEffect(() => {
		try {
			vscode.postMessage({ type })
		} catch (error) {
			console.error("[useStatusMessage] Failed to post message", error)
		}
	}, [type, ...deps])
}
