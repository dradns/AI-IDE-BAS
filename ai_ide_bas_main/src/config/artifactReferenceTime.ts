import * as path from "path"

export interface ArtifactReferenceConfig {
	documentation_templates: Array<{
		file_format: string
		reference_creation_time_sec: number
	}>
}

/**
 * Загружает конфигурацию эталонного времени создания артефактов
 */
export function loadArtifactReferenceConfig(): ArtifactReferenceConfig {
	return require("./artifact_generation_time.json")
}

/**
 * Получает эталонное время создания для файла по его имени
 * @param fileName - имя файла (например: "test_uc.md")
 * @returns эталонное время в миллисекундах или undefined если формат не найден
 */
export function getReferenceTime(fileName: string): number | undefined {
	const config = loadArtifactReferenceConfig()
	
	// Извлекаем только имя файла без пути
	const baseFileName = path.basename(fileName)
	
	console.log('[DEBUG] getReferenceTime: fileName =', fileName, ', baseFileName =', baseFileName)
	
	for (const template of config.documentation_templates) {
		// Преобразуем glob pattern в regex
		// Например: "*_uc.md" → "^.*_uc\.md$"
		// ВАЖНО: сначала экранируем точки, потом заменяем звездочки!
		const pattern = template.file_format
			.replace(/\./g, "\\.") // . → \. (экранируем точку)
			.replace(/\*/g, ".*") // * → .* (любые символы)
		
		const regex = new RegExp(`^${pattern}$`)
		
		console.log('[DEBUG] Testing pattern:', template.file_format, '→ regex:', regex, '→ pattern string:', `^${pattern}$`, 'against:', baseFileName, '→ match:', regex.test(baseFileName))
		
		if (regex.test(baseFileName)) {
			// Конвертируем секунды в миллисекунды
			const referenceTimeMs = template.reference_creation_time_sec * 1000
			console.log('[DEBUG] MATCH FOUND! Reference time:', referenceTimeMs, 'ms (', template.reference_creation_time_sec, 's)')
			return referenceTimeMs
		}
	}
	
	console.log('[DEBUG] No matching pattern found for:', baseFileName)
	return undefined // Формат не найден в конфигурации
}

/**
 * Рассчитывает сэкономленное время
 * @param fileName - имя файла
 * @param actualDuration - фактическое время генерации в миллисекундах
 * @returns сэкономленное время в миллисекундах или undefined
 */
export function calculateTimeSaved(fileName: string, actualDuration: number): number | undefined {
	console.log('[DEBUG] calculateTimeSaved: fileName =', fileName, ', actualDuration =', actualDuration, 'ms')
	
	const referenceTime = getReferenceTime(fileName)
	
	if (referenceTime === undefined) {
		console.log('[DEBUG] calculateTimeSaved: No reference time found, returning undefined')
		return undefined // Формат не найден
	}
	
	const timeSaved = referenceTime - actualDuration
	
	console.log('[DEBUG] calculateTimeSaved: referenceTime =', referenceTime, 'ms, timeSaved =', timeSaved, 'ms')
	
	// Возвращаем только если время действительно сэкономлено (положительное число)
	if (timeSaved > 0) {
		console.log('[DEBUG] calculateTimeSaved: Returning timeSaved =', timeSaved, 'ms')
		return timeSaved
	} else {
		console.log('[DEBUG] calculateTimeSaved: timeSaved is not positive, returning undefined')
		return undefined
	}
}

