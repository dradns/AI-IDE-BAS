import { useEffect, useRef, useState } from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

import type { CloudUserInfo } from "@roo-code/types"
import { TelemetryEventName } from "@roo-code/types"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"
import { telemetryClient } from "@src/utils/TelemetryClient"

type AccountViewProps = {
	userInfo: CloudUserInfo | null
	isAuthenticated: boolean
	cloudApiUrl?: string
	onDone: () => void
}

export const AccountView = ({ userInfo, isAuthenticated, cloudApiUrl: _cloudApiUrl, onDone }: AccountViewProps) => {
	const { t } = useAppTranslation()
	const wasAuthenticatedRef = useRef(false)
	const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
	const [loading, setLoading] = useState<boolean>(false)
	const [me, setMe] = useState<any | null>(null)

	// Resolve local images base URI exposed by the extension host
	const imagesBaseUri = (window as any).IMAGES_BASE_URI || ""
	const fallbackAvatar = `${imagesBaseUri}/fallback-avatar.jpg`

	// Normalize common field names from different backends
	const name = me?.name ?? (me as any)?.full_name ?? (me as any)?.fullName ?? (me as any)?.user?.name ?? userInfo?.name
	const email =
		me?.email ??
		(me as any)?.email_address ??
		(me as any)?.emailAddress ??
		(me as any)?.user?.email ??
		userInfo?.email
	const tokensValue =
		typeof me?.tokens !== "undefined"
			? me?.tokens
			: typeof (me as any)?.token_balance !== "undefined"
				? (me as any)?.token_balance
				: typeof (me as any)?.balance !== "undefined"
					? (me as any)?.balance
					: typeof (me as any)?.credits !== "undefined"
						? (me as any)?.credits
						: (userInfo as any)?.tokens

	// const _rooLogoUri = (window as any).IMAGES_BASE_URI + "/roo-logo.svg" // unused after design change

	// Backend auth state + profile fetch
	useEffect(() => {
		const handler = (e: MessageEvent<any>) => {
			const message = e.data
			if (message?.type === "files:authChanged") {
				const authorized = Boolean(message.isAuthorized)
				setIsAuthorized(authorized)
				if (authorized) {
					setLoading(true)
					vscode.postMessage({ type: "files:me" })
				} else {
					setMe(null)
				}
			} else if (message?.type === "files:me:result") {
				setMe(message.me || null)
				setLoading(false)
			}
		}

		window.addEventListener("message", handler)
		vscode.postMessage({ type: "files:status" })
		return () => window.removeEventListener("message", handler)
	}, [])

	// Track logout success via backend auth state
	useEffect(() => {
		if (isAuthorized) {
			wasAuthenticatedRef.current = true
		} else if (wasAuthenticatedRef.current && !isAuthorized) {
			telemetryClient.capture(TelemetryEventName.ACCOUNT_LOGOUT_SUCCESS)
			wasAuthenticatedRef.current = false
		}
	}, [isAuthorized])

	const handleConnectClick = () => {
		// Send telemetry for account connect action
		telemetryClient.capture(TelemetryEventName.ACCOUNT_CONNECT_CLICKED)
		vscode.postMessage({ type: "files:login" })
	}

	const handleLogoutClick = () => {
		// Send telemetry for account logout action
		telemetryClient.capture(TelemetryEventName.ACCOUNT_LOGOUT_CLICKED)
		vscode.postMessage({ type: "files:logout" })
	}

// const handleVisitCloudWebsite = () => {
//     // Send telemetry for cloud website visit
//     telemetryClient.capture(TelemetryEventName.ACCOUNT_CONNECT_CLICKED)
//     const cloudUrl = cloudApiUrl || "https://app.roocode.com"
//     vscode.postMessage({ type: "openExternal", url: cloudUrl })
// }

	const authenticated = isAuthorized || isAuthenticated

	return (
		<div className="flex flex-col h-full p-4 bg-vscode-editor-background">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-xl font-medium text-vscode-foreground">{t("account:title")}</h1>
				<VSCodeButton appearance="primary" onClick={onDone}>
					{t("settings:common.done")}
				</VSCodeButton>
			</div>
			{authenticated ? (
				<>
					{loading ? (
						<div className="flex flex-col items-center mb-6 animate-pulse">
							<div className="w-16 h-16 mb-3 rounded-full bg-vscode-editorWidget-background" />
							<div className="h-4 w-40 bg-vscode-editorWidget-background rounded mb-2" />
							<div className="h-3 w-56 bg-vscode-editorWidget-background rounded" />
						</div>
                    ) : (me || userInfo) && (
						<div className="flex flex-col items-center mb-6">
							<div className="w-16 h-16 mb-3 rounded-full overflow-hidden">
								<img
									src={
										me?.avatar_url ||
										me?.avatarUrl ||
										me?.avatar ||
										me?.picture ||
										userInfo?.picture ||
										fallbackAvatar
									}
									onError={(e) => {
										const el = e.currentTarget as HTMLImageElement
										el.onerror = null
										el.src = fallbackAvatar
									}}
									alt={t("account:profilePicture")}
									className="w-full h-full object-cover"
								/>
							</div>
							{name && (
								<h2 className="text-lg font-medium text-vscode-foreground mb-0">{name}</h2>
							)}
							{email && (
								<p className="text-sm text-vscode-descriptionForeground">{email}</p>
							)}
							{typeof tokensValue !== "undefined" && (
                                <div className="mt-2 text-sm">
                                    <span className="text-vscode-descriptionForeground">Tokens:</span>{" "}
										<span className="font-medium">{tokensValue}</span>
                                </div>
                            )}
							{(me?.organization?.name || userInfo?.organizationName) && (
								<div className="flex items-center gap-2 text-sm text-vscode-descriptionForeground">
									{(me?.organization?.image_url || userInfo?.organizationImageUrl) && (
										<img
											src={me?.organization?.image_url || userInfo?.organizationImageUrl}
											alt={me?.organization?.name || userInfo?.organizationName}
											className="w-4 h-4 rounded object-cover"
										/>
									)}
									<span>{me?.organization?.name || userInfo?.organizationName}</span>
								</div>
							)}
						</div>
					)}
					<div className="flex flex-col gap-2 mt-4">
						<VSCodeButton appearance="secondary" onClick={handleLogoutClick} className="w-full">
							{t("account:logOut")}
						</VSCodeButton>
					</div>
				</>
			) : (
				<>
					<div className="flex flex-col mb-6 text-center">
						<h2 className="text-lg font-medium text-vscode-foreground mb-2">
							{t("account:cloudBenefitsTitle")}
						</h2>
						<p className="text-md text-vscode-descriptionForeground mb-4">
							{t("account:cloudBenefitsSubtitle")}
						</p>
						<ul className="text-sm text-vscode-descriptionForeground space-y-2 max-w-xs mx-auto">
							<li className="flex items-start">
								<span className="mr-2 text-vscode-foreground">•</span>
								{t("account:cloudBenefitHistory")}
							</li>
							<li className="flex items-start">
								<span className="mr-2 text-vscode-foreground">•</span>
								{t("account:cloudBenefitSharing")}
							</li>
							<li className="flex items-start">
								<span className="mr-2 text-vscode-foreground">•</span>
								{t("account:cloudBenefitMetrics")}
							</li>
						</ul>
					</div>

					<div className="flex flex-col gap-4">
						<VSCodeButton appearance="primary" onClick={handleConnectClick} className="w-full">
							{t("account:connect")}
						</VSCodeButton>
					</div>
				</>
			)}
		</div>
	)
}
