import { z } from "zod"

/**
 * FileArtifactTiming - для отслеживания времени создания/изменения файловых артефактов
 */

export const fileArtifactTimingSchema = z.object({
	executionId: z.string(),
	artifactType: z.enum(["created", "modified"]),
	startTime: z.number(),
	endTime: z.number().optional(),
	duration: z.number().optional(),
	status: z.enum(["started", "completed", "error"]),
	error: z.string().optional(),
	details: z.object({
		fileName: z.string(),
		linesOfCode: z.number().optional(),
		timeSaved: z.number().optional(),
	}).optional(),
})

export type FileArtifactTiming = z.infer<typeof fileArtifactTimingSchema>

// Keep old type for backward compatibility during migration
export const artifactGenerationTimingSchema = fileArtifactTimingSchema
export type ArtifactGenerationTiming = FileArtifactTiming
