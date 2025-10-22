import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { vscode } from "@src/utils/vscode"

export function RooCloudCTA() {
	// i18n for Welcome page
	const { t } = useTranslation("welcome")
	const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
	const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)

	// Track backend auth state for Files API
	useEffect(() => {
		const handler = (e: MessageEvent<any>) => {
			const message = e.data
			if (message?.type === "files:authChanged") {
				setIsAuthorized(Boolean(message.isAuthorized))
				// Сбросить состояние загрузки при успешной авторизации
				if (message.isAuthorized) {
					setIsLoggingIn(false)
				}
			}
		}

		window.addEventListener("message", handler)
		vscode.postMessage({ type: "files:status" })
		return () => window.removeEventListener("message", handler)
	}, [])

	// Обработчик нажатия кнопки авторизации
	const handleLogin = () => {
		setIsLoggingIn(true)
		vscode.postMessage({ type: "files:login" })
		
		// Таймаут на случай, если пользователь закроет окно авторизации
		// или что-то пойдет не так - сбросим состояние через 30 секунд
		setTimeout(() => {
			setIsLoggingIn(false)
		}, 30000)
	}

	return (
		<div className="border border-muted/20 px-4 py-3 flex flex-col gap-3">
			{/* Header with logo placeholder and site link */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<i className="codicon codicon-cloud text-xl text-vscode-descriptionForeground" />
					<a className="link text-base" href="#" onClick={(e)=>{ e.preventDefault(); vscode.postMessage({ type: "openExternal", url: "https://aiidebas.com/" }) }}>
						https://aiidebas.com/
					</a>
				</div>
				<div className="flex items-center gap-2">
					{/* Social links with branded SVG icons */}
					<button
						aria-label={t("cloudCta.social.telegram")}
						className="h-8 w-8 rounded-full border border-vscode-editorWidget-border bg-vscode-editorWidget-background hover:bg-vscode-list-hoverBackground flex items-center justify-center"
						title={t("cloudCta.social.telegram")}
						onClick={()=>vscode.postMessage({ type: "openExternal", url: "https://t.me/AI_IDE_BAS" })}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9.04 15.314 8.8 18.94a.8.8 0 0 0 1.274.664l3.007-2.07 3.12 2.287c.574.421 1.381.102 1.544-.592l2.72-11.64c.17-.727-.52-1.358-1.225-1.11L2.2 10.06c-.81.286-.777 1.45.048 1.67l4.95 1.34 10.93-6.78-9.089 9.024Z"/></svg>
					</button>
					<button
						aria-label={t("cloudCta.social.youtube")}
						className="h-8 w-8 rounded-full border border-vscode-editorWidget-border bg-vscode-editorWidget-background hover:bg-vscode-list-hoverBackground flex items-center justify-center"
						title={t("cloudCta.social.youtube")}
						onClick={()=>vscode.postMessage({ type: "openExternal", url: "https://www.youtube.com/@ai_ide_bas" })}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.9 31.9 0 0 0 0 12a31.9 31.9 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.9 31.9 0 0 0 24 12a31.9 31.9 0 0 0-.5-5.8ZM9.6 15.4V8.6l6.2 3.4-6.2 3.4Z"/></svg>
					</button>
					<button
						aria-label={t("cloudCta.social.vk")}
						className="h-8 w-8 rounded-full border border-vscode-editorWidget-border bg-vscode-editorWidget-background hover:bg-vscode-list-hoverBackground flex items-center justify-center"
						title={t("cloudCta.social.vk")}
						onClick={()=>vscode.postMessage({ type: "openExternal", url: "https://vk.com/ai_ide_bas?from=groups" })}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.54 7.07c.13-.41 0-.71-.6-.71h-1.99c-.51 0-.75.27-.88.57 0 0-1.03 2.5-2.49 4.12-.47.47-.69.62-.95.62-.13 0-.32-.16-.32-.58V7.07c0-.52-.15-.71-.57-.71H9.58c-.32 0-.52.24-.52.47 0 .49.73.6.81 1.96v2.96c0 .65-.12.77-.37.77-.69 0-2.36-2.53-3.36-5.43-.2-.57-.41-.8-.95-.8H2.06c-.6 0-.72.28-.72.57 0 .53.69 3.15 3.22 6.61 1.68 2.42 4.05 3.73 6.23 3.73 1.3 0 1.46-.29 1.46-.8v-1.84c0-.58.12-.69.53-.69.3 0 .83.15 2.06 1.3 1.41 1.41 1.64 2.04 2.42 2.04h1.99c.61 0 .91-.29.74-.86-.2-.63-.92-1.55-1.88-2.64-.53-.6-1.34-1.24-1.58-1.56-.3-.39-.21-.57 0-.92 0 0 2.8-3.94 3.09-5.29Z"/></svg>
					</button>
					<button
						aria-label={t("cloudCta.social.github")}
						className="h-8 w-8 rounded-full border border-vscode-editorWidget-border bg-vscode-editorWidget-background hover:bg-vscode-list-hoverBackground flex items-center justify-center"
						title={t("cloudCta.social.github")}
						onClick={()=>vscode.postMessage({ type: "openExternal", url: "https://github.com/dradns/AI-IDE-BAS" })}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path fillRule="evenodd" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.77.6-3.36-1.19-3.36-1.19-.45-1.15-1.11-1.45-1.11-1.45-.9-.61.07-.6.07-.6 1 .07 1.52 1.03 1.52 1.03.89 1.52 2.34 1.08 2.91.83.09-.64.35-1.08.63-1.33-2.21-.25-4.54-1.11-4.54-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.53 9.53 0 0 1 12 6.84c.85 0 1.7.11 2.5.33 1.9-1.29 2.74-1.02 2.74-1.02.56 1.37.21 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86 0 1.34-.01 2.41-.01 2.73 0 .27.18.58.69.48A10 10 0 0 0 12 2Z" clipRule="evenodd"/></svg>
					</button>
					<button
						aria-label={t("cloudCta.social.instagram")}
						className="h-8 w-8 rounded-full border border-vscode-editorWidget-border bg-vscode-editorWidget-background hover:bg-vscode-list-hoverBackground flex items-center justify-center"
						title={t("cloudCta.social.instagram")}
						onClick={()=>vscode.postMessage({ type: "openExternal", url: "https://www.instagram.com/ai_ide_bas?igsh=MWc5Z3JxZm81YjYyMA==" })}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5Zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5Zm5.25-3a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 17.25 6.5Z"/></svg>
					</button>
				</div>
			</div>

			{/* Welcome text */}
			<div className="text-left bg-vscode-editorWidget-background border border-vscode-editorWidget-border rounded p-3 leading-relaxed">
				<div className="font-semibold mb-1">{t("cloudCta.title")}</div>
				<p className="m-0 mb-2">{t("cloudCta.desc")}</p>
				<ul className="m-0 pl-4 list-disc space-y-1">
					<li>{t("cloudCta.features.bonus")}</li>
					<li>{t("cloudCta.features.productionArtifacts")}</li>
					<li>{t("cloudCta.features.inviteFriends")}</li>
					<li>{t("cloudCta.features.googleSignIn")}</li>
					<li>{t("cloudCta.features.workAnywhere")}</li>
				</ul>
			</div>

			{/* Google sign-in */}
			{!isAuthorized && (
				<div className="flex flex-col gap-2">
					<div className="flex justify-start">
						<button
							className="h-9 rounded-full px-4 inline-flex items-center gap-2 border border-vscode-editorWidget-border bg-[color:var(--vscode-editor-background)] hover:bg-vscode-list-hoverBackground disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
							onClick={handleLogin}
							disabled={isLoggingIn}
							aria-label={t("cloudCta.signInWithGoogle")}>
							{isLoggingIn ? (
								<>
									{/* Спиннер загрузки */}
									<svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
									</svg>
									<span className="text-sm">{t("cloudCta.openingBrowser")}</span>
								</>
							) : (
								<>
									{/* Google G logo */}
									<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
										<path fill="#EA4335" d="M24 9.5c3.7 0 7 1.3 9.6 3.8l7.2-7.2C36.6 2 30.8 0 24 0 14.6 0 6.4 5.3 2.4 13l8.8 6.8C13 14.1 18.1 9.5 24 9.5z"/>
										<path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.7-.4-4H24v8h12.7c-.6 3.1-2.4 5.7-5 7.4l7.7 6c4.5-4.2 7.1-10.4 7.1-17.4z"/>
										<path fill="#FBBC05" d="M11.2 28.2C10.7 26.7 10.5 25 10.5 23s.2-3.7.7-5.2l-8.8-6.8C.8 14.8 0 18.3 0 23c0 4.7.8 8.2 2.4 12l8.8-6.8z"/>
										<path fill="#34A853" d="M24 46c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6 0-11.1-4.1-12.8-9.6l-8.8 6.8C6.4 42.7 14.6 46 24 46z"/>
									</svg>
									<span className="text-sm">{t("cloudCta.signInWithGoogle")}</span>
								</>
							)}
						</button>
					</div>
					{isLoggingIn && (
						<p className="text-xs text-vscode-descriptionForeground m-0">{t("cloudCta.checkBrowserWindow")}</p>
					)}
				</div>
			)}
		</div>
	)
}

export default RooCloudCTA
