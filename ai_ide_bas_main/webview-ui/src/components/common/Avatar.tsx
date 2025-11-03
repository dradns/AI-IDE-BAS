import { useState } from "react"

type AvatarProps = {
	avatarUrl?: string
	displayName?: string
	email?: string
	size?: number
	className?: string
	alt?: string
}

function getInitials(displayName?: string, email?: string): string {
	if (displayName) {
		const parts = displayName.trim().split(/\s+/)
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
		}
		if (parts.length === 1 && parts[0].length > 0) {
			return parts[0][0].toUpperCase()
		}
	}
	if (email) {
		const firstChar = email[0].toUpperCase()
		return firstChar
	}
	return "?"
}

export function Avatar({ avatarUrl, displayName, email, size = 64, className = "", alt }: AvatarProps) {
	const [hasError, setHasError] = useState(false)

	const shouldShowImage = avatarUrl && !hasError
	const initials = getInitials(displayName, email)
	const displayText = displayName || email || "User"
	const ariaLabel = alt || `Avatar of ${displayText}`

	return (
		<div
			className={`rounded-full overflow-hidden flex items-center justify-center bg-vscode-editorWidget-background border border-vscode-editorWidget-border relative ${className}`}
			style={{ width: size, height: size, minWidth: size, minHeight: size }}>
			{shouldShowImage ? (
				<img
					src={avatarUrl}
					alt={ariaLabel}
					className="w-full h-full object-cover"
					onError={() => {
						setHasError(true)
					}}
					aria-label={ariaLabel}
				/>
			) : (
				<div
					className="w-full h-full flex items-center justify-center text-vscode-foreground font-medium select-none"
					style={{ fontSize: size * 0.4 }}
					aria-label={ariaLabel}>
					{initials}
				</div>
			)}
		</div>
	)
}

