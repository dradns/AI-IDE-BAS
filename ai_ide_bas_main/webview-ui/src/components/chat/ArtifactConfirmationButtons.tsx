import React from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { vscode } from "@src/utils/vscode"

interface ArtifactConfirmationButtonsProps {
	files: Array<{
		executionId: string
		fileName: string
		artifactType: "created" | "modified"
	}>
}

export const ArtifactConfirmationButtons: React.FC<ArtifactConfirmationButtonsProps> = ({ files }) => {
	if (!files || files.length === 0) {
		return null
	}

	return (
		<div
			style={{
				marginTop: 16,
				padding: "12px",
				backgroundColor: "var(--vscode-editor-background)",
				border: "1px solid var(--vscode-panel-border)",
				borderRadius: "4px",
			}}
		>
			<div
				style={{
					fontSize: 12,
					marginBottom: 12,
					color: "var(--vscode-foreground)",
				}}
			>
				{files.length === 1
					? `File ${files[0].artifactType}: ${files[0].fileName}`
					: `${files.length} files processed`}
			</div>

			<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
				<VSCodeButton
					onClick={() => {
						console.log('[DEBUG] Document Ready clicked')
						vscode.postMessage({
							type: "askResponse",
							askResponse: "yesButtonClicked",
						})
					}}
				>
					<span className="codicon codicon-check" style={{ marginRight: 6 }} />
					Document Ready
				</VSCodeButton>

				<VSCodeButton
					appearance="secondary"
					onClick={() => {
						console.log('[DEBUG] Document Not Accepted clicked')
						vscode.postMessage({
							type: "askResponse",
							askResponse: "noButtonClicked",
						})
					}}
				>
					<span className="codicon codicon-close" style={{ marginRight: 6 }} />
					Document Not Accepted
				</VSCodeButton>
			</div>
		</div>
	)
}

