import React, { useState, useCallback, useEffect } from "react"
import { Copy, Mail, Users, Coins, CheckCircle2, XCircle } from "lucide-react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

import { useCopyToClipboard } from "@src/utils/clipboard"
import { Button } from "@src/components/ui/button"
import { Input } from "@src/components/ui/input"
import { cn } from "@src/lib/utils"

type InviteFriendViewProps = {
	onDone?: () => void
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

export function InviteFriendView({ onDone }: InviteFriendViewProps) {
	const { showCopyFeedback, copyWithFeedback } = useCopyToClipboard(2000)

	// Mock data - будет заменено реальными данными при интеграции
	const personalCode = "INVITE-FRIEND-2024-ABC123"
	const [email, setEmail] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [toasts, setToasts] = useState<ToastMessage[]>([])

	// Mock статистика
	const stats = {
		invitedFriends: 5,
		tokensReceived: 150,
	}

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
			const success = await copyWithFeedback(personalCode, e)
			if (success) {
				addToast("Код скопирован", "success")
			} else {
				addToast("Не удалось скопировать код", "error")
			}
		},
		[personalCode, copyWithFeedback, addToast],
	)

	const handleSubmitEmail = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (!email.trim()) {
				addToast("Введите email адрес", "error")
				return
			}

			// Basic email validation
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(email.trim())) {
				addToast("Некорректный email адрес", "error")
				return
			}

			setIsSubmitting(true)

			// Simulate API call - только UI, без реальных запросов
			setTimeout(() => {
				setIsSubmitting(false)
				addToast("Письмо отправлено", "success")
				setEmail("")
			}, 800)
		},
		[email, addToast],
	)

	return (
		<div className="flex flex-col h-full bg-vscode-editor-background">
			{/* Header */}
			<div className="flex justify-between items-center px-5 py-4 border-b border-vscode-panel-border">
				<h1 className="text-xl font-medium text-vscode-foreground">Пригласи друга</h1>
				{onDone && (
					<VSCodeButton appearance="primary" onClick={onDone}>
						Готово
					</VSCodeButton>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto px-5 py-6">
				<div className="max-w-2xl mx-auto space-y-6">
					{/* Personal Code Section */}
					<div className="bg-vscode-editorWidget-background border border-vscode-dropdown-border rounded-xs p-5 space-y-4">
						<div className="flex items-center gap-2">
							<Copy className="w-5 h-5 text-vscode-foreground" />
							<h2 className="text-lg font-medium text-vscode-foreground">Ваш персональный код</h2>
						</div>
						<p className="text-sm text-vscode-descriptionForeground">
							Поделитесь этим кодом с друзьями, чтобы они могли присоединиться
						</p>
						<div className="flex items-center gap-3">
							<div className="flex-1 px-4 py-2.5 bg-vscode-input-background border border-vscode-input-border rounded-xs font-mono text-sm text-vscode-input-foreground break-all">
								{personalCode}
							</div>
							<Button
								variant={showCopyFeedback ? "secondary" : "default"}
								size="default"
								onClick={handleCopyCode}
								className="shrink-0"
								disabled={showCopyFeedback}>
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
							<h2 className="text-lg font-medium text-vscode-foreground">Отправить приглашение по email</h2>
						</div>
						<p className="text-sm text-vscode-descriptionForeground">
							Введите email адрес друга, и мы отправим ему приглашение
						</p>
						<form onSubmit={handleSubmitEmail} className="flex items-end gap-3">
							<div className="flex-1">
								<Input
									type="email"
									placeholder="email@google.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={isSubmitting}
									className="w-full"
								/>
							</div>
							<Button type="submit" disabled={isSubmitting || !email.trim()}>
								{isSubmitting ? "Отправка..." : "Отправить"}
							</Button>
						</form>
					</div>

					{/* Statistics Section */}
					<div className="bg-vscode-editorWidget-background border border-vscode-dropdown-border rounded-xs p-5">
						<h2 className="text-lg font-medium text-vscode-foreground mb-4">Статистика</h2>
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
					</div>

					{/* Info Section */}
					<div className="bg-vscode-input-background border border-vscode-dropdown-border rounded-xs p-4">
						<p className="text-sm text-vscode-descriptionForeground">
							За каждого приглашенного друга вы получите бонусные токены. Ваш друг также получит токены при
							регистрации.
						</p>
					</div>
				</div>
			</div>

			{/* Toast Messages */}
			{toasts.map((toast) => (
				<Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
			))}
		</div>
	)
}

