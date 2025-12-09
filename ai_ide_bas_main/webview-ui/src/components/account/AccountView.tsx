import { useEffect, useRef, useState, useCallback } from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { Copy, Mail, Users, Coins, CheckCircle2, XCircle } from "lucide-react"

import type { CloudUserInfo } from "@roo-code/types"
import { TelemetryEventName } from "@roo-code/types"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"
import { telemetryClient } from "@src/utils/TelemetryClient"
import { useCopyToClipboard } from "@src/utils/clipboard"
import { Button } from "@src/components/ui/button"
import { Input } from "@src/components/ui/input"
import { cn } from "@src/lib/utils"
import { useStatusMessage } from "../../hooks/useSafeVscodeMessage"

type AccountViewProps = {
	userInfo: CloudUserInfo | null
	isAuthenticated: boolean
	cloudApiUrl?: string
	onDone: () => void
}

type ToastMessage = {
	id: string
	message: string
	type: "success" | "error"
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
	useEffect(() => {
		const timer = setTimeout(() => {
			onClose()
		}, 3000)

		return () => clearTimeout(timer)
	}, [onClose])

	return (
		<div
			className={cn(
				"fixed top-4 right-4 z-50 px-4 py-3 rounded-xs border shadow-lg flex items-center gap-2 min-w-[280px] animate-fade-in",
				type === "success"
					? "bg-vscode-notifications-background border-vscode-notifications-border text-vscode-notifications-foreground"
					: "bg-vscode-errorForeground/10 border-vscode-errorForeground/30 text-vscode-errorForeground",
			)}>
			{type === "success" ? (
				<CheckCircle2 className="w-4 h-4 shrink-0" />
			) : (
				<XCircle className="w-4 h-4 shrink-0" />
			)}
			<p className="text-sm flex-1">{message}</p>
			<button
				onClick={onClose}
				className="shrink-0 text-vscode-descriptionForeground hover:text-vscode-foreground transition-colors">
				<span className="codicon codicon-close text-base" />
			</button>
		</div>
	)
}

export const AccountView = ({ userInfo, isAuthenticated, cloudApiUrl: _cloudApiUrl, onDone }: AccountViewProps) => {
	const { t } = useAppTranslation()
	const wasAuthenticatedRef = useRef(false)
	const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
	const [loading, setLoading] = useState<boolean>(false)
	const [me, setMe] = useState<any | null>(null)

	// Invite friend state
	const { showCopyFeedback, copyWithFeedback } = useCopyToClipboard(2000)
	const [_personalCode, setPersonalCode] = useState<string>("")
	const [referralLink, setReferralLink] = useState<string>("")
	const [inviteEmail, setInviteEmail] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoadingStats, setIsLoadingStats] = useState(false)
	const [toasts, setToasts] = useState<ToastMessage[]>([])

	// Statistics
	const [stats, setStats] = useState({
		invitedFriends: 0,
		tokensReceived: 0,
	})

	// Безопасная отправка статусного сообщения с защитой от рекурсивных сбоев
	useStatusMessage("files:status")

	const addToast = useCallback((message: string, type: "success" | "error") => {
		const id = Math.random().toString(36).substring(7)
		setToasts((prev) => [...prev, { id, message, type }])
	}, [])

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id))
	}, [])

	const handleCopyCode = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault()
			if (!referralLink) {
				addToast("Ссылка пока недоступна", "error")
				return
			}
			const success = await copyWithFeedback(referralLink, e)
			if (success) {
				addToast("Ссылка скопирована", "success")
			} else {
				addToast("Не удалось скопировать ссылку", "error")
			}
		},
		[referralLink, copyWithFeedback, addToast],
	)

	const handleSubmitEmail = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (!inviteEmail.trim()) {
				addToast("Введите email адрес", "error")
				return
			}

			// Basic email validation
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(inviteEmail.trim())) {
				addToast("Некорректный email адрес", "error")
				return
			}

			setIsSubmitting(true)
			vscode.postMessage({ type: "referral:send", text: inviteEmail.trim() })
		},
		[inviteEmail, addToast],
	)

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

	// Backend auth state + profile fetch + referral data
	useEffect(() => {
		const handler = (e: MessageEvent<any>) => {
			const message = e.data
			if (message?.type === "files:authChanged") {
				const authorized = Boolean(message.isAuthorized)
				setIsAuthorized(authorized)
				if (authorized) {
					setLoading(true)
					setIsLoadingStats(true)
					vscode.postMessage({ type: "files:me" })
					// Загружаем реферальную ссылку и статистику
					vscode.postMessage({ type: "referral:link" })
					vscode.postMessage({ type: "referral:stats" })
				} else {
					setMe(null)
					setPersonalCode("")
					setReferralLink("")
					setStats({ invitedFriends: 0, tokensReceived: 0 })
				}
			} else if (message?.type === "files:me:result") {
				setMe(message.me || null)
				setLoading(false)
			} else if (message?.type === "referral:link:result") {
				setReferralLink(message.referral_link || "")
				setPersonalCode(message.referral_code || message.referral_link || "")
			} else if (message?.type === "referral:send:result") {
				setIsSubmitting(false)
				if (message.ok) {
					addToast(message.message || "Письмо отправлено", "success")
					setInviteEmail("")
					// Обновляем статистику
					vscode.postMessage({ type: "referral:stats" })
				} else {
					addToast(message.message || "Не удалось отправить приглашение", "error")
				}
			} else if (message?.type === "referral:stats:result") {
				setIsLoadingStats(false)
				setStats({
					invitedFriends: message.invited_count || 0,
					tokensReceived: message.tokens_received || 0,
				})
			} else if (message?.type === "referral:error") {
				setIsSubmitting(false)
				setIsLoadingStats(false)
				const errorMsg = typeof message.error === "string" 
					? message.error 
					: message.error?.message || "Не удалось выполнить операцию. Попробуйте позже."
				addToast(errorMsg, "error")
			}
		}

		window.addEventListener("message", handler)
		vscode.postMessage({ type: "files:status" })
		return () => window.removeEventListener("message", handler)
	}, [addToast])

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
		<div className="flex flex-col h-full bg-vscode-editor-background">
			<div className="flex justify-between items-center px-4 pt-4 pb-2 flex-shrink-0">
				<h1 className="text-xl font-medium text-vscode-foreground">{t("account:title")}</h1>
				<VSCodeButton appearance="primary" onClick={onDone}>
					{t("settings:common.done")}
				</VSCodeButton>
			</div>
			<div className="flex-1 overflow-auto px-4 pb-4">
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

					{/* Invite Friend Section */}
					<div className="mt-8 space-y-6">
						<h2 className="text-lg font-medium text-vscode-foreground">Пригласи друга</h2>

						{/* Referral link section */}
						<div className="bg-vscode-editorWidget-background border border-vscode-dropdown-border rounded-xs p-5 space-y-4">
							<div className="flex items-center gap-2">
								<Copy className="w-5 h-5 text-vscode-foreground" />
								<h3 className="text-base font-medium text-vscode-foreground">Ваша реферальная ссылка</h3>
							</div>
							<p className="text-sm text-vscode-descriptionForeground">
								Поделитесь этой ссылкой с друзьями, чтобы они могли присоединиться
							</p>
							<div className="flex items-center gap-3">
								<div className="flex-1 px-4 py-2.5 bg-vscode-input-background border border-vscode-input-border rounded-xs font-mono text-sm text-vscode-input-foreground break-all">
									{referralLink || (isAuthorized ? "Загрузка..." : "Войдите для получения ссылки")}
								</div>
								<Button
									variant={showCopyFeedback ? "secondary" : "default"}
									size="default"
									onClick={handleCopyCode}
									className="shrink-0"
									disabled={showCopyFeedback || !referralLink}>
									{showCopyFeedback ? (
										<>
											<CheckCircle2 className="w-4 h-4" />
											Скопировано
										</>
									) : (
										<>
											<Copy className="w-4 h-4" />
											Скопировать
										</>
									)}
								</Button>
							</div>
						</div>

						{/* Email Invite Section */}
						<div className="bg-vscode-editorWidget-background border border-vscode-dropdown-border rounded-xs p-5 space-y-4">
							<div className="flex items-center gap-2">
								<Mail className="w-5 h-5 text-vscode-foreground" />
								<h3 className="text-base font-medium text-vscode-foreground">Отправить приглашение по email</h3>
							</div>
							<p className="text-sm text-vscode-descriptionForeground">
								Введите email адрес друга, и мы отправим ему приглашение
							</p>
							<form onSubmit={handleSubmitEmail} className="flex items-end gap-3">
								<div className="flex-1">
									<Input
										type="email"
										placeholder="email@google.com"
										value={inviteEmail}
										onChange={(e) => setInviteEmail(e.target.value)}
										disabled={isSubmitting}
										className="w-full"
									/>
								</div>
								<Button type="submit" disabled={isSubmitting || !inviteEmail.trim()}>
									{isSubmitting ? "Отправка..." : "Отправить"}
								</Button>
							</form>
						</div>

						{/* Statistics Section */}
						<div className="bg-vscode-editorWidget-background border border-vscode-dropdown-border rounded-xs p-5">
							<h3 className="text-base font-medium text-vscode-foreground mb-4">Статистика</h3>
							{isLoadingStats ? (
								<div className="flex items-center justify-center py-4">
									<div className="text-sm text-vscode-descriptionForeground">Загрузка...</div>
								</div>
							) : (
								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-3 p-3 bg-vscode-input-background rounded-xs">
										<div className="w-10 h-10 rounded-xs bg-vscode-button-secondaryBackground flex items-center justify-center">
											<Users className="w-5 h-5 text-vscode-button-secondaryForeground" />
										</div>
										<div>
											<p className="text-2xl font-semibold text-vscode-foreground">{stats.invitedFriends}</p>
											<p className="text-xs text-vscode-descriptionForeground">Друзей приглашено</p>
										</div>
									</div>
									<div className="flex items-center gap-3 p-3 bg-vscode-input-background rounded-xs">
										<div className="w-10 h-10 rounded-xs bg-vscode-button-secondaryBackground flex items-center justify-center">
											<Coins className="w-5 h-5 text-vscode-button-secondaryForeground" />
										</div>
										<div>
											<p className="text-2xl font-semibold text-vscode-foreground">{stats.tokensReceived}</p>
											<p className="text-xs text-vscode-descriptionForeground">Токенов получено</p>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Info Section */}
						<div className="bg-vscode-input-background border border-vscode-dropdown-border rounded-xs p-4">
							<p className="text-sm text-vscode-descriptionForeground">
								За каждого приглашенного друга вы получите бонусные токены. Ваш друг также получит токены при
								регистрации.
							</p>
						</div>
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

			{/* Toast Messages - fixed position outside scrollable container */}
			{toasts.map((toast) => (
				<Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
			))}
		</div>
	)
}
