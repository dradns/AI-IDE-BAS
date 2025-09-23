import { useEffect } from "react"

/**
 * Hook that listens for clicks on non-interactive elements and calls the provided handler.
 *
 * Interactive elements (inputs, textareas, selects, contentEditable) are excluded
 * to avoid disrupting user typing or form interactions.
 *
 * @param handler - Function to call when a non-interactive element is clicked
 */
export function useAddNonInteractiveClickListener(handler: () => void, enabled: boolean = true) {
	useEffect(() => {
		if (!enabled) return

		const handleContentClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement

			// Treat native and custom toolkit interactive elements as interactive
			const interactiveSelector = [
				"button",
				"a",
				"input",
				"select",
				"textarea",
				"[role=button]",
				"[role=link]",
				"[role=menuitem]",
				"[role=tab]",
				"[role=listbox]",
				"[role=option]",
				"vscode-button",
				"vscode-link",
				"vscode-text-area",
				"vscode-text-field",
				"vscode-dropdown",
			].join(",")

			const isInteractive =
				target.isContentEditable ||
				target.closest(interactiveSelector) !== null

			if (!isInteractive) {
				handler()
			}
		}

		// Add listener to the document body to handle all clicks
		document.body.addEventListener("click", handleContentClick)

		return () => {
			document.body.removeEventListener("click", handleContentClick)
		}
	}, [handler, enabled])
}
