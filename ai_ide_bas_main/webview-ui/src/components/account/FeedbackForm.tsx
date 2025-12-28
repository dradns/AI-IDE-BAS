import { useState, useEffect } from "react"
import { VSCodeButton, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react"
import { Star, Send, Check, AlertCircle } from "lucide-react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"

interface FeedbackFormProps {
	isAuthorized: boolean
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	taskId?: string // taskId to use as session_id
	source?: "manual" | "automatic" // "manual" = from profile, "automatic" = from task completion
}

export const FeedbackForm = ({ isAuthorized, isOpen, onOpenChange, taskId, source = "automatic" }: FeedbackFormProps) => {
	const { t } = useAppTranslation()
	const [rating, setRating] = useState<number>(0)
	const [hoveredRating, setHoveredRating] = useState<number>(0)
	const [comment, setComment] = useState<string>("")
	const [submitting, setSubmitting] = useState<boolean>(false)
	const [submitted, setSubmitted] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const handler = (e: MessageEvent<any>) => {
			const message = e.data
			if (message?.type === "feedback:result") {
				setSubmitting(false)
				if (message.feedback?.success) {
					setSubmitted(true)
					setError(null)
					// Auto-close dialog after 2 seconds
					setTimeout(() => {
						onOpenChange(false)
						// Reset form after dialog closes
						setTimeout(() => {
							setSubmitted(false)
							setRating(0)
							setComment("")
						}, 300)
					}, 2000)
				}
			} else if (message?.type === "feedback:error") {
				setSubmitting(false)
				const errorMessage = message.feedback?.message || message.error || t("account:feedback.submitFailed")
				// Check if error message is about rate limit and replace with localized version
				// Match common rate limit error patterns from backend
				const errorLower = errorMessage?.toLowerCase() || ""
				const isRateLimitError = errorLower.includes("rate limit exceeded") ||
					(errorLower.includes("maximum") && errorLower.includes("feedbacks") && errorLower.includes("per"))
				setError(isRateLimitError ? t("account:feedback.rateLimitExceeded") : errorMessage)
			}
		}

		window.addEventListener("message", handler)
		return () => window.removeEventListener("message", handler)
	}, [t, onOpenChange])

	const handleSubmit = () => {
		if (!rating) {
			setError(t("account:feedback.selectRating"))
			return
		}

		setSubmitting(true)
		setError(null)

		// Use taskId as session_id if provided, otherwise generate one
		// taskId prevents duplicate feedback for the same task (backend logic)
		const sessionId = taskId || `feedback_${Date.now()}`

		vscode.postMessage({
			type: "feedback:submit",
			feedback: {
				rating,
				comment: comment.trim() || null,
				session_id: sessionId,
				source,
			},
		})
	}

	// Reset form when dialog closes
	useEffect(() => {
		if (!isOpen) {
			setTimeout(() => {
				if (!submitted) {
					setRating(0)
					setComment("")
					setError(null)
					setHoveredRating(0)
				}
			}, 300)
		}
	}, [isOpen, submitted])

	const handleClose = () => {
		if (!submitting) {
			// If form is closed without submitting (not in submitted state), mark as dismissed
			if (!submitted && rating === 0) {
				vscode.postMessage({
					type: "feedback:dismissed",
				})
			}
			onOpenChange(false)
		}
	}

	if (submitted) {
		return (
			<Dialog open={isOpen} onOpenChange={handleClose}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
								<Check className="w-3 h-3 text-white" />
							</div>
							{t("account:feedback.submittedTitle")}
						</DialogTitle>
						<DialogDescription>{t("account:feedback.submittedDescription")}</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<p className="text-sm text-vscode-foreground">
							{t("account:feedback.submittedMessage")}
						</p>
					</div>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{t("account:feedback.title")}</DialogTitle>
					<DialogDescription>{t("account:feedback.description")}</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{/* Star Rating */}
					<div>
						<label className="block text-sm font-medium text-vscode-foreground mb-2">
							{t("account:feedback.ratingRequired")}
						</label>
						<div className="flex gap-1" onMouseLeave={() => setHoveredRating(0)}>
							{[1, 2, 3, 4, 5].map((star) => (
								<button
									key={star}
									type="button"
									onClick={() => {
										setRating(star)
										setError(null)
									}}
									onMouseEnter={() => setHoveredRating(star)}
									className="p-1 rounded hover:bg-vscode-list-hoverBackground transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-button-hoverBackground"
									aria-label={t("account:feedback.rateStars", { count: star })}
									disabled={submitting}
								>
									<Star
										className={`w-7 h-7 transition-colors ${
											star <= (hoveredRating || rating)
												? "fill-yellow-400 text-yellow-400"
												: "fill-vscode-editorWidget-background text-vscode-descriptionForeground"
										}`}
									/>
								</button>
							))}
						</div>
					</div>

					{/* Comment Textarea */}
					<div>
						<label className="block text-sm font-medium text-vscode-foreground mb-2">
							{t("account:feedback.commentOptional")}
						</label>
						<VSCodeTextArea
							value={comment}
							onInput={(e: any) => {
								const value = e.target.value || ""
								// Обрезаем до 1000 символов, если превышен лимит
								const trimmedValue = value.slice(0, 1000)
								setComment(trimmedValue)
								setError(null)
							}}
							placeholder={t("account:feedback.placeholder")}
							rows={4}
							className="w-full"
							disabled={submitting}
							maxlength={1000}
						/>
						<div className="flex justify-between items-center mt-1">
							{error && (
								<p className="text-xs text-red-500 flex items-center gap-1">
									<AlertCircle className="w-3 h-3" />
									{error}
								</p>
							)}
							<p className="text-xs text-vscode-descriptionForeground ml-auto">
								{comment.length}/1000
							</p>
						</div>
					</div>

				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose} disabled={submitting}>
						{t("account:feedback.cancel")}
					</Button>
					<Button
						variant="default"
						onClick={handleSubmit}
						disabled={!rating || submitting}
					>
						{submitting ? (
							<span className="flex items-center gap-2">
								<span className="animate-spin">⟳</span>
								{t("account:feedback.submitting")}
							</span>
						) : (
							<span className="flex items-center gap-2">
								<Send className="w-4 h-4" />
								{t("account:feedback.submit")}
							</span>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

