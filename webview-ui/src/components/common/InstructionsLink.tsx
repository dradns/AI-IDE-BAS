import React, { useState, useEffect } from "react"
import { vscode } from "@src/utils/vscode"

interface InstructionsLinkProps {
	instructionsUrl: string
	title?: string
	className?: string
}

export const InstructionsLink: React.FC<InstructionsLinkProps> = ({
	instructionsUrl,
	title = "Инструкция по настройке",
	className = "",
}) => {
	const [isLightTheme, setIsLightTheme] = useState(false)

	useEffect(() => {
		const checkTheme = () => {
			setIsLightTheme(document.body.className.toLowerCase().includes("light"))
		}

		// Проверяем тему при монтировании
		checkTheme()

		// Создаем наблюдатель за изменениями класса body
		const observer = new MutationObserver(checkTheme)
		observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })

		return () => observer.disconnect()
	}, [])

	const handleClick = () => {
		vscode.postMessage({
			type: "openExternal",
			url: instructionsUrl,
		})
	}

	const buttonClasses = isLightTheme
		? "w-full bg-white hover:bg-gray-100 active:bg-gray-200 text-blue-600 border border-blue-600 font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-3 no-underline"
		: "w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-3 no-underline"

	return (
		<div className={`w-full max-w-md mx-auto my-4 ${className}`}>
			<a
				href={instructionsUrl}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(e) => {
					e.preventDefault()
					handleClick()
				}}
				className={buttonClasses}>
				{/* Иконка документа */}
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
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
