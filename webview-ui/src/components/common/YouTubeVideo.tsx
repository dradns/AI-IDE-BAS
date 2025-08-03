import React from "react"
import { vscode } from "@src/utils/vscode"

interface YouTubeLinkProps {
	videoUrl: string
	title?: string
	className?: string
}

export const YouTubeLink: React.FC<YouTubeLinkProps> = ({ videoUrl, title = "Смотреть видео", className = "" }) => {
	const handleClick = () => {
		vscode.postMessage({
			type: "openExternal",
			url: videoUrl,
		})
	}

	return (
		<div className={`w-full max-w-md mx-auto my-4 ${className}`}>
			<a
				href={videoUrl}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(e) => {
					e.preventDefault()
					handleClick()
				}}
				className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center gap-3 no-underline">
				{/* YouTube иконка */}
				<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
					<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
				</svg>
				<span>{title}</span>
				{/* Иконка внешней ссылки */}
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
			</a>
		</div>
	)
}
