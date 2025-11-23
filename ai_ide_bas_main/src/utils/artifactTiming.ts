import { Task } from "../core/task/Task"
import { FileArtifactTiming } from "@roo-code/types"
import { calculateTimeSaved } from "../config/artifactReferenceTime"
import * as path from "path"

/**
 * Утилиты для отслеживания времени создания/изменения файловых артефактов
 */

/**
 * Начинает отслеживание времени создания/изменения артефакта
 */
export async function startArtifactTiming(
	task: Task,
	executionId: string,
	fileName: string,
	artifactType: "created" | "modified",
): Promise<void> {
	const startTime = Date.now()
	
	// Сохраняем информацию о начале генерации в состоянии задачи
	if (!task.activeArtifactTimings) {
		task.activeArtifactTimings = new Map()
	}
	
	task.activeArtifactTimings.set(executionId, {
		executionId,
		fileName,
		artifactType,
		startTime,
	})
}

/**
 * Завершает отслеживание времени и отправляет сообщение с результатом
 */
export async function completeArtifactTiming(
	task: Task,
	executionId: string,
	error?: string,
): Promise<void> {
	if (!task.activeArtifactTimings) {
		return
	}
	
	const timingSession = task.activeArtifactTimings.get(executionId)
	if (!timingSession) {
		return
	}
	
	const endTime = Date.now()
	const duration = endTime - timingSession.startTime
	
	// Рассчитываем сэкономленное время
	const timeSaved = calculateTimeSaved(timingSession.fileName, duration)
	
	// Отладочное сообщение для пользователя
	console.log('[DEBUG] ===== ARTIFACT TIMING DEBUG =====')
	console.log('[DEBUG] fileName:', timingSession.fileName)
	console.log('[DEBUG] duration:', duration, 'ms (', (duration/1000).toFixed(1), 's )')
	console.log('[DEBUG] timeSaved:', timeSaved, 'ms (', timeSaved ? (timeSaved/1000).toFixed(1) : 'N/A', 's )')
	console.log('[DEBUG] ===================================')
	
	const timing: FileArtifactTiming = {
		executionId,
		artifactType: timingSession.artifactType,
		startTime: timingSession.startTime,
		endTime,
		duration,
		status: error ? "error" : "completed",
		error,
		details: {
			fileName: timingSession.fileName,
			timeSaved,
		},
	}
	
	console.log('[DEBUG] Completing artifact timing:', {
		fileName: timingSession.fileName,
		duration: `${duration}ms`,
		timeSaved: timeSaved ? `${timeSaved}ms` : 'none',
		timing
	})
	
	// DEBUG: Send debug message to user
	await task.say("text", `[DEBUG ARTIFACT TIMING]\nFile: ${timingSession.fileName}\nDuration: ${(duration/1000).toFixed(1)}s\nTime Saved: ${timeSaved ? (timeSaved/1000).toFixed(1) + 's' : 'N/A (no match or negative)'}`)
	
	await task.say("file_artifact_timing", JSON.stringify(timing))
	
	// ✨ НОВОЕ: Сохраняем в storage для отображения через CodeLens
	const provider = task.providerRef.deref()
	const context = (provider as any)?.context
	
	if (context) {
		// Динамически импортируем ArtifactTimingStorage, чтобы избежать циклических зависимостей
		const { ArtifactTimingStorage } = await import("./artifactTimingStorage")
		const storage = new ArtifactTimingStorage(context)
		
		const absolutePath = path.join(task.cwd, timingSession.fileName)
		await storage.saveTiming(
			absolutePath,
			timingSession.artifactType,
			duration,
			timeSaved
		)
		
		// Обновляем CodeLens (если provider существует)
		const codeLensProvider = (context as any).artifactTimingCodeLensProvider
		if (codeLensProvider) {
			codeLensProvider.refresh()
		}
		
		console.log('[TIMING STORAGE] Saved and refreshed CodeLens for', timingSession.fileName)
	}
	
	// Удаляем завершенную сессию
	task.activeArtifactTimings.delete(executionId)
}

/**
 * Отменяет отслеживание времени (используется при отклонении пользователем)
 */
export function cancelArtifactTiming(
	task: Task,
	executionId: string,
): void {
	if (!task.activeArtifactTimings) {
		return
	}
	
	task.activeArtifactTimings.delete(executionId)
}

/**
 * Создает уникальный ID для выполнения
 */
export function createExecutionId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Запрашивает подтверждение готовности артефакта от пользователя
 * Возвращает данные для отображения или null если нет файлов
 */
export function prepareArtifactConfirmation(
	task: Task,
	executionIds: string[],
): string | null {
	if (!task.activeArtifactTimings || executionIds.length === 0) {
		console.log('[DEBUG] prepareArtifactConfirmation: No active timings or empty executionIds')
		return null
	}
	
	const files = executionIds
		.map((id) => task.activeArtifactTimings?.get(id))
		.filter((session) => session !== undefined)
		.map((session) => ({
			executionId: session!.executionId,
			fileName: session!.fileName,
			artifactType: session!.artifactType,
		}))
	
	if (files.length === 0) {
		console.log('[DEBUG] prepareArtifactConfirmation: No files found for executionIds:', executionIds)
		return null
	}
	
	const confirmationRequest = {
		type: "artifact_confirmation",
		executionIds,
		files,
	}
	
	console.log('[DEBUG] Preparing artifact confirmation:', confirmationRequest)
	
	return JSON.stringify(confirmationRequest)
}

/**
 * Форматирует время в читаемый вид
 */
export function formatDuration(milliseconds: number): string {
	if (milliseconds < 1000) {
		return `${milliseconds}ms`
	} else if (milliseconds < 60000) {
		return `${(milliseconds / 1000).toFixed(1)}s`
	} else {
		const minutes = Math.floor(milliseconds / 60000)
		const seconds = ((milliseconds % 60000) / 1000).toFixed(1)
		return `${minutes}m ${seconds}s`
	}
}

