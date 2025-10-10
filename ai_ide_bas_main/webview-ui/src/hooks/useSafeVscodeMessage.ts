import { useEffect, useRef } from "react"
import { vscode } from "@src/utils/vscode"
import { WebviewMessage } from "@roo/WebviewMessage"

/**
 * Специализированный хук для безопасной отправки сообщений в VS Code Host.
 * Гарантирует, что сообщение отправляется только после полной инициализации API,
 * предотвращая рекурсивные сбои и блокировку UI.
 * 
 * @param message - Сообщение для отправки
 * @param dependencies - Зависимости для повторной отправки (как в useEffect)
 * @param options - Дополнительные опции
 */
export function useSafeVscodeMessage(
	message: WebviewMessage | null,
	dependencies: React.DependencyList = [],
	options: {
		delay?: number // Задержка перед отправкой (по умолчанию 100ms)
		maxRetries?: number // Максимальное количество попыток (по умолчанию 3)
		retryDelay?: number // Задержка между попытками (по умолчанию 200ms)
	} = {}
) {
	const {
		delay = 100,
		maxRetries = 3,
		retryDelay = 200
	} = options

	const retryCountRef = useRef(0)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		// Если сообщение не предоставлено, ничего не делаем
		if (!message) {
			return
		}

		// Сбрасываем счетчик попыток при изменении зависимостей
		retryCountRef.current = 0

		// Функция безопасной отправки сообщения
		const sendMessageSafely = () => {
			try {
				// Отправляем сообщение через наш защищенный API
				vscode.postMessage(message)
				console.debug("[DEBUG] Safe message sent successfully:", message.type)
			} catch (err) {
				console.warn("[DEBUG] Safe message send failed:", err)
				
				// Если не достигли максимума попыток, повторяем
				if (retryCountRef.current < maxRetries) {
					retryCountRef.current++
					console.debug(`[DEBUG] Retrying message send (${retryCountRef.current}/${maxRetries})`)
					
					timeoutRef.current = setTimeout(() => {
						sendMessageSafely()
					}, retryDelay)
				} else {
					console.error("[ERROR] Max retries reached for safe message send")
				}
			}
		}

		// Устанавливаем задержку перед отправкой для обеспечения инициализации API
		timeoutRef.current = setTimeout(() => {
			sendMessageSafely()
		}, delay)

		// Очистка при размонтировании или изменении зависимостей
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
		}
	}, [message, ...dependencies, delay, maxRetries, retryDelay])
}

/**
 * Хук для отправки сообщения статуса (например, files:status)
 * Специально оптимизирован для сообщений, которые должны отправляться при монтировании компонента
 */
export function useStatusMessage(messageType: string, dependencies: React.DependencyList = []) {
	useSafeVscodeMessage(
		{ type: messageType as any },
		dependencies,
		{
			delay: 50, // Быстрая отправка для статусных сообщений
			maxRetries: 2, // Меньше попыток для статусных сообщений
			retryDelay: 100 // Быстрые повторы
		}
	)
}
