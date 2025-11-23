import React, { useState, useEffect, useCallback } from "react"
import { useEvent } from "react-use"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { fileArtifactTimingSchema } from "@roo-code/types"
import { safeJsonParse } from "../../../../src/shared/safeJsonParse"

interface ArtifactGenerationTimingProps {
	executionId: string
	initialTiming?: any
}

interface TimingState {
	artifactType: "created" | "modified"
	status: "started" | "completed" | "error"
	startTime?: number
	endTime?: number
	duration?: number
	error?: string
	details?: {
		fileName: string
		linesOfCode?: number
		timeSaved?: number
	}
}

export const ArtifactGenerationTiming: React.FC<ArtifactGenerationTimingProps> = ({
	executionId,
	initialTiming,
}) => {
	const [timing, setTiming] = useState<TimingState | null>(initialTiming || null)

	const onMessage = useCallback(
		(event: MessageEvent) => {
			const message: ExtensionMessage = event.data

			if (message.type === "file_artifact_timing") {
				console.log('[DEBUG] ArtifactGenerationTiming received message:', message)
				try {
					const result = fileArtifactTimingSchema.safeParse(
						safeJsonParse(message.text || "{}", {})
					)

					console.log('[DEBUG] Parse result:', result)

					if (result.success) {
						const data = result.data

						console.log('[DEBUG] Parsed data:', data, 'Looking for executionId:', executionId)
						console.log('[DEBUG] timeSaved from data:', data.details?.timeSaved)

						// Only update if this message is for our execution
						if (data.executionId === executionId) {
							console.log('[DEBUG] Setting timing state:', data)
							console.log('[DEBUG] details object:', data.details)
							console.log('[DEBUG] timeSaved value:', data.details?.timeSaved)
							setTiming({
								artifactType: data.artifactType,
								status: data.status,
								startTime: data.startTime,
								endTime: data.endTime,
								duration: data.duration,
								error: data.error,
								details: data.details,
							})
						} else {
							console.log('[DEBUG] ExecutionId mismatch:', data.executionId, '!==', executionId)
						}
					}
				} catch (e) {
					console.error("Failed to parse file artifact timing", e)
				}
			}
		},
		[executionId]
	)

	useEvent("message", onMessage)

	// Initialize with initial timing if provided
	useEffect(() => {
		if (initialTiming && !timing) {
			setTiming(initialTiming)
		}
	}, [initialTiming, timing])

	if (!timing) {
		return null
	}

	console.log('[DEBUG] Rendering with timing:', timing)
	console.log('[DEBUG] timeSaved check:', {
		hasDetails: !!timing.details,
		timeSaved: timing.details?.timeSaved,
		isPositive: timing.details?.timeSaved && timing.details.timeSaved > 0
	})

	const formatDurationFromMs = (ms: number) => {
		if (ms < 1000) {
			return `${ms}ms`
		} else if (ms < 60000) {
			return `${(ms / 1000).toFixed(1)}s`
		} else {
			const minutes = Math.floor(ms / 60000)
			const seconds = ((ms % 60000) / 1000).toFixed(1)
			return `${minutes}m ${seconds}s`
		}
	}

	return (
		<div
			style={{
				padding: "8px 12px",
				backgroundColor: "var(--vscode-editor-background)",
				border: "1px solid var(--vscode-panel-border)",
				borderRadius: "4px",
				margin: "4px 0",
				fontSize: "12px",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: "4px",
				}}
			>
				{timing.details?.fileName && (
					<span
						style={{
							color: "var(--vscode-foreground)",
							fontSize: "12px",
							fontWeight: "500",
						}}
					>
						{timing.artifactType === "created" ? "File created:" : "File modified:"} {timing.details.fileName}
					</span>
				)}
				{timing.duration && (
					<span
						style={{
							color: "var(--vscode-descriptionForeground)",
							fontSize: "11px",
						}}
					>
						{formatDurationFromMs(timing.duration)}
					</span>
				)}
			</div>

			{/* Time Saved - показывается на второй строке */}
			{timing.details?.timeSaved && timing.details.timeSaved > 0 && (
				<div
					style={{
						fontSize: "11px",
						color: "var(--vscode-descriptionForeground)",
						marginTop: "4px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<span>Time saved:</span>
					<span>{formatDurationFromMs(timing.details.timeSaved)}</span>
				</div>
			)}

			{timing.error && (
				<div
					style={{
						marginTop: "4px",
						padding: "4px 6px",
						backgroundColor: "var(--vscode-inputValidation-errorBackground)",
						border: "1px solid var(--vscode-inputValidation-errorBorder)",
						borderRadius: "2px",
						color: "var(--vscode-errorForeground)",
						fontSize: "11px",
					}}
				>
					Error: {timing.error}
				</div>
			)}
		</div>
	)
}
