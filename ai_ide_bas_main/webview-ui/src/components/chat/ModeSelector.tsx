import React from "react"
import { ChevronUp, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRooPortal } from "@/components/ui/hooks/useRooPortal"
import { Popover, PopoverContent, PopoverTrigger, StandardTooltip } from "@/components/ui"
import { IconButton } from "./IconButton"
import { vscode } from "@/utils/vscode"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { Mode, getAllModes, getAllModesSync } from "@roo/modes"
import { ModeConfig, CustomModePrompts } from "@roo-code/types"
import { telemetryClient } from "@/utils/TelemetryClient"
import { TelemetryEventName } from "@roo-code/types"
import { Fzf } from "fzf"

// Minimum number of modes required to show search functionality
const SEARCH_THRESHOLD = 6

interface ModeSelectorProps {
	value: Mode
	onChange: (value: Mode) => void
	disabled?: boolean
	title?: string
	triggerClassName?: string
	modeShortcutText: string
	customModes?: ModeConfig[]
	customModePrompts?: CustomModePrompts
	disableSearch?: boolean
}

export const ModeSelector = ({
	value,
	onChange,
	disabled = false,
	title = "",
	triggerClassName = "",
	modeShortcutText,
	customModes,
	customModePrompts,
	disableSearch = false,
}: ModeSelectorProps) => {
	const [open, setOpen] = React.useState(false)
	const [searchValue, setSearchValue] = React.useState("")
	const searchInputRef = React.useRef<HTMLInputElement>(null)
	const portalContainer = useRooPortal("roo-portal")
	const { hasOpenedModeSelector, setHasOpenedModeSelector, apiRoles, language } = useExtensionState()
	const { t } = useAppTranslation()

	const trackModeSelectorOpened = React.useCallback(() => {
		// Track telemetry every time the mode selector is opened
		telemetryClient.capture(TelemetryEventName.MODE_SELECTOR_OPENED)

		// Track first-time usage for UI purposes
		if (!hasOpenedModeSelector) {
			setHasOpenedModeSelector(true)
			vscode.postMessage({ type: "hasOpenedModeSelector", bool: true })
		}
	}, [hasOpenedModeSelector, setHasOpenedModeSelector])

	// Get all modes including custom modes and merge custom prompt descriptions
	// Загружаем режимы асинхронно, включая роли из API
	// Начальное состояние - синхронная версия (без ролей из API) для быстрого рендеринга
	const [modes, setModes] = React.useState<ModeConfig[]>(() => {
		const initialModes = getAllModesSync(customModes)
		// ⚠️ КРИТИЧНО: Нормализуем язык для совместимости с бэкендом (ru-RU -> ru, en-US -> en)
		const normalizedLang = language ? language.split("-")[0].toLowerCase() : "en"
		return initialModes.map((mode) => {
			// Use pickTextFromMultilang to extract description based on current language
			const promptDescription = customModePrompts?.[mode.slug]?.description
			const extractedDescription = promptDescription 
				? (typeof promptDescription === "string" 
					? promptDescription 
					: (promptDescription[normalizedLang] || promptDescription[language || "en"] || promptDescription["en"] || promptDescription["ru"] || Object.values(promptDescription)[0] || ""))
				: mode.description
			return {
				...mode,
				description: extractedDescription,
			}
		})
	})

	// Запрашиваем роли из API через extension host (избегаем CORS в webview)
	React.useEffect(() => {
		console.log(`[ModeSelector] Requesting API roles from extension host with language="${language}"...`)
		vscode.postMessage({ type: "requestApiRoles", language })
	}, [language])

	// Обновляем режимы когда получаем роли из API
	React.useEffect(() => {
		if (apiRoles && apiRoles.length > 0) {
			console.log(`[ModeSelector] Received ${apiRoles.length} roles from extension host:`, apiRoles.map(r => r.slug).join(", "))
			
			// ⚠️ КРИТИЧНО: Логируем short_description из apiRoles для отладки
			apiRoles.forEach(role => {
				console.log(`[ModeSelector] API Role ${role.slug}: short_description=${JSON.stringify(role.short_description)}`)
			})
			
		// Получаем все режимы с ролями из API
		// Передаем язык для правильного извлечения текста из многоязычных объектов
			getAllModes(customModes, undefined, apiRoles, language).then((allModes) => {
				console.log(`[ModeSelector] Total modes after API: ${allModes.length}`, allModes.map(m => m.slug).join(", "))
				// Логируем описания для отладки
				allModes.forEach(mode => {
					console.log(`[ModeSelector] Mode ${mode.slug}: description="${mode.description || "(empty)"}"`)
				})
				// Используем функциональное обновление, чтобы сохранить описания из предыдущего состояния, если новые пустые
				setModes((prevModes) => {
				const updatedModes = allModes.map((mode) => {
						// Приоритет: customModePrompts > apiRoles.short_description > API description (из getAllModes) > предыдущее описание
					// Если есть описание из customModePrompts - используем его, иначе используем описание из API
						// Если описание из API пустое, сохраняем предыдущее описание
					// Use pickTextFromMultilang to extract description based on current language
					const promptDescription = customModePrompts?.[mode.slug]?.description
						const apiDescription = mode.description || ""
						const prevMode = prevModes.find(m => m.slug === mode.slug)
						const prevDescription = prevMode?.description || ""
						
					// ⚠️ КРИТИЧНО: Нормализуем язык для совместимости с бэкендом (ru-RU -> ru, en-US -> en)
					const normalizedLang = language ? language.split("-")[0].toLowerCase() : "en"
					
					// ⚠️ КРИТИЧНО: Также проверяем short_description напрямую из apiRoles
					const apiRole = apiRoles.find(r => r.slug.toLowerCase() === mode.slug.toLowerCase())
					let apiRoleDescription = ""
					if (apiRole?.short_description) {
						const sd = apiRole.short_description
						apiRoleDescription = sd[normalizedLang] || sd[language || "en"] || sd["en"] || sd["ru"] || Object.values(sd)[0] || ""
						console.log(`[ModeSelector] Extracted description for ${mode.slug} from apiRole.short_description: "${apiRoleDescription}"`)
					}
					
					const finalDescription = promptDescription
						? (typeof promptDescription === "string"
							? promptDescription
							: (promptDescription[normalizedLang] || promptDescription[language || "en"] || promptDescription["en"] || promptDescription["ru"] || Object.values(promptDescription)[0] || ""))
							: (apiRoleDescription || apiDescription || prevDescription)
						
						console.log(`[ModeSelector] Final description for ${mode.slug}: "${finalDescription}" (from customModePrompts: ${!!promptDescription}, from apiRole: ${!!apiRoleDescription}, from API: ${!!apiDescription}, from prev: ${!!prevDescription})`)
					return {
						...mode,
						description: finalDescription,
					}
				})
				console.log(`[ModeSelector] Setting modes with descriptions:`, updatedModes.map(m => ({ slug: m.slug, description: m.description || "(empty)" })))
					return updatedModes
				})
			}).catch((error) => {
				console.warn(`[ModeSelector] Failed to process API roles:`, error)
			})
		}
	}, [apiRoles, customModes, language])

	// Отдельный эффект для обновления описаний при изменении customModePrompts
	// Не перезагружаем режимы из API, только обновляем описания в существующих режимах
	// Важно: не обновляем описания, если режимы еще не загружены из API (нет apiRoles)
	React.useEffect(() => {
		// Пропускаем обновление, если режимы еще не загружены из API
		// Это предотвращает потерю описаний при первом рендере
		if (!apiRoles || apiRoles.length === 0) {
			console.log(`[ModeSelector] Skipping customModePrompts update: apiRoles not loaded yet`)
			return
		}
		
		setModes((prevModes) => {
			// Пропускаем обновление, если режимы еще не инициализированы
			if (prevModes.length === 0) {
				console.log(`[ModeSelector] Skipping customModePrompts update: prevModes is empty`)
				return prevModes
			}
			
			console.log(`[ModeSelector] Updating descriptions from customModePrompts, prevModes count: ${prevModes.length}`)
			const updatedModes = prevModes.map((mode) => {
				// Приоритет: customModePrompts > текущее описание
				// Если в customModePrompts есть описание - используем его, иначе сохраняем текущее
				const promptComponent = customModePrompts?.[mode.slug]
				const promptDescription = promptComponent?.description
				const currentDescription = mode.description || ""
				
				// Если в customModePrompts нет описания (undefined), сохраняем текущее описание
				// Это важно: когда описание удаляется из customModePrompts при редактировании,
				// мы должны сохранить описание из API
				// Проверяем, что promptDescription действительно определено (не undefined и не пустая строка после извлечения)
				let finalDescription = currentDescription
				
				if (promptDescription !== undefined) {
					const extractedDescription = typeof promptDescription === "string"
						? promptDescription
						: (promptDescription[language || "en"] || promptDescription["en"] || Object.values(promptDescription)[0] || "")
					
					// Используем описание из customModePrompts только если оно не пустое
					if (extractedDescription && extractedDescription.trim()) {
						finalDescription = extractedDescription
					}
					// Если extractedDescription пустое, сохраняем currentDescription (описание из API)
				}
				// Если promptDescription === undefined, сохраняем currentDescription (описание из API)
				
				// Обновляем описание только если оно изменилось
				if (finalDescription !== currentDescription) {
					console.log(`[ModeSelector] Updating description for ${mode.slug} from customModePrompts: "${currentDescription}" -> "${finalDescription}" (hasPromptComponent: ${!!promptComponent}, hasPromptDescription: ${promptDescription !== undefined})`)
					return {
						...mode,
						description: finalDescription,
					}
				}
				// Логируем, если описание сохраняется
				if (currentDescription && currentDescription.trim()) {
					console.log(`[ModeSelector] Keeping description for ${mode.slug}: "${currentDescription}" (hasPromptComponent: ${!!promptComponent}, hasPromptDescription: ${promptDescription !== undefined})`)
				}
				return mode
			})
			return updatedModes
		})
	}, [customModePrompts, language, apiRoles])

	// Find the selected mode
	const selectedMode = React.useMemo(() => modes.find((mode) => mode.slug === value), [modes, value])

	// Memoize searchable items for fuzzy search with separate name and description search
	const nameSearchItems = React.useMemo(() => {
		return modes.map((mode) => ({
			original: mode,
			searchStr: [mode.name, mode.slug].filter(Boolean).join(" "),
		}))
	}, [modes])

	const descriptionSearchItems = React.useMemo(() => {
		return modes.map((mode) => ({
			original: mode,
			searchStr: mode.description || "",
		}))
	}, [modes])

	// Create memoized Fzf instances for name and description searches
	const nameFzfInstance = React.useMemo(() => {
		return new Fzf(nameSearchItems, {
			selector: (item) => item.searchStr,
		})
	}, [nameSearchItems])

	const descriptionFzfInstance = React.useMemo(() => {
		return new Fzf(descriptionSearchItems, {
			selector: (item) => item.searchStr,
		})
	}, [descriptionSearchItems])

	// Filter modes based on search value using fuzzy search with priority
	const filteredModes = React.useMemo(() => {
		if (!searchValue) return modes

		// First search in names/slugs
		const nameMatches = nameFzfInstance.find(searchValue)
		const nameMatchedModes = new Set(nameMatches.map((result) => result.item.original.slug))

		// Then search in descriptions
		const descriptionMatches = descriptionFzfInstance.find(searchValue)

		// Combine results: name matches first, then description matches
		const combinedResults = [
			...nameMatches.map((result) => result.item.original),
			...descriptionMatches
				.filter((result) => !nameMatchedModes.has(result.item.original.slug))
				.map((result) => result.item.original),
		]

		return combinedResults
	}, [modes, searchValue, nameFzfInstance, descriptionFzfInstance])

	const onClearSearch = React.useCallback(() => {
		setSearchValue("")
		searchInputRef.current?.focus()
	}, [])

	const handleSelect = React.useCallback(
		(modeSlug: string) => {
			onChange(modeSlug as Mode)
			setOpen(false)
			// Clear search after selection
			setSearchValue("")
		},
		[onChange],
	)

	const onOpenChange = React.useCallback(
		(isOpen: boolean) => {
			if (isOpen) trackModeSelectorOpened()
			setOpen(isOpen)
			// Clear search when closing
			if (!isOpen) {
				setSearchValue("")
			}
		},
		[trackModeSelectorOpened],
	)

	// Auto-focus search input when popover opens
	React.useEffect(() => {
		if (open && searchInputRef.current) {
			searchInputRef.current.focus()
		}
	}, [open])

	// Determine if search should be shown
	const showSearch = !disableSearch && modes.length > SEARCH_THRESHOLD

	// Combine instruction text for tooltip
	const instructionText = `${t("chat:modeSelector.description")} ${modeShortcutText}`

	const trigger = (
		<PopoverTrigger
			disabled={disabled}
			data-testid="mode-selector-trigger"
			className={cn(
				"inline-flex items-center gap-1.5 relative whitespace-nowrap px-1.5 py-1 text-xs",
				"bg-transparent border border-[rgba(255,255,255,0.08)] rounded-md text-vscode-foreground",
				"transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder focus-visible:ring-inset",
				disabled
					? "opacity-50 cursor-not-allowed"
					: "opacity-90 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.15)] cursor-pointer",
				triggerClassName,
				!disabled && !hasOpenedModeSelector
					? "bg-primary opacity-90 hover:bg-primary-hover text-vscode-button-foreground"
					: null,
			)}>
			<ChevronUp className="pointer-events-none opacity-80 flex-shrink-0 size-3" />
			<span className="truncate">{selectedMode?.name || ""}</span>
		</PopoverTrigger>
	)

	return (
		<Popover open={open} onOpenChange={onOpenChange} data-testid="mode-selector-root">
			{title ? <StandardTooltip content={title}>{trigger}</StandardTooltip> : trigger}

			<PopoverContent
				align="start"
				sideOffset={4}
				container={portalContainer}
				className="p-0 overflow-hidden min-w-80 max-w-9/10">
				<div className="flex flex-col w-full">
					{/* Show search bar only when there are more than SEARCH_THRESHOLD items, otherwise show info blurb */}
					{showSearch ? (
						<div className="relative p-2 border-b border-vscode-dropdown-border">
							<input
								aria-label="Search modes"
								ref={searchInputRef}
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
								placeholder={t("chat:modeSelector.searchPlaceholder")}
								className="w-full h-8 px-2 py-1 text-xs bg-vscode-input-background text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-0"
								data-testid="mode-search-input"
							/>
							{searchValue.length > 0 && (
								<div className="absolute right-4 top-0 bottom-0 flex items-center justify-center">
									<X
										className="text-vscode-input-foreground opacity-50 hover:opacity-100 size-4 p-0.5 cursor-pointer"
										onClick={onClearSearch}
									/>
								</div>
							)}
						</div>
					) : (
						<div className="p-3 border-b border-vscode-dropdown-border">
							<p className="m-0 text-xs text-vscode-descriptionForeground">{instructionText}</p>
						</div>
					)}

					{/* Mode List */}
					<div className="max-h-[300px] overflow-y-auto">
						{filteredModes.length === 0 && searchValue ? (
							<div className="py-2 px-3 text-sm text-vscode-foreground/70">
								{t("chat:modeSelector.noResults")}
							</div>
						) : (
							<div className="py-1">
								{filteredModes.map((mode) => (
									<div
										key={mode.slug}
										onClick={() => handleSelect(mode.slug)}
										className={cn(
											"px-3 py-1.5 text-sm cursor-pointer flex items-center",
											"hover:bg-vscode-list-hoverBackground",
											mode.slug === value
												? "bg-vscode-list-activeSelectionBackground text-vscode-list-activeSelectionForeground"
												: "",
										)}
										data-testid="mode-selector-item">
										<div className="flex-1 min-w-0">
											<div className="font-bold truncate">{mode.name}</div>
											{mode.description && mode.description.trim() && (
												<div className="text-xs text-vscode-descriptionForeground truncate mt-0.5">
													{mode.description}
												</div>
											)}
										</div>
										{mode.slug === value && <Check className="ml-auto size-4 p-0.5" />}
									</div>
								))}
							</div>
						)}
					</div>

					{/* Bottom bar with buttons on left and title on right */}
					<div className="flex flex-row items-center justify-between px-2 py-2 border-t border-vscode-dropdown-border">
						<div className="flex flex-row gap-1">
							<IconButton
								iconClass="codicon-extensions"
								title={t("chat:modeSelector.marketplace")}
								onClick={() => {
									window.postMessage(
										{
											type: "action",
											action: "marketplaceButtonClicked",
											values: { marketplaceTab: "mode" },
										},
										"*",
									)
									setOpen(false)
								}}
							/>
							<IconButton
								iconClass="codicon-settings-gear"
								title={t("chat:modeSelector.settings")}
								onClick={() => {
									vscode.postMessage({
										type: "switchTab",
										tab: "modes",
									})
									setOpen(false)
								}}
							/>
						</div>

						{/* Info icon and title on the right - only show info icon when search bar is visible */}
						<div className="flex items-center gap-1 pr-1">
							{showSearch && (
								<StandardTooltip content={instructionText}>
									<span className="codicon codicon-info text-xs text-vscode-descriptionForeground opacity-70 hover:opacity-100 cursor-help" />
								</StandardTooltip>
							)}
							<h4 className="m-0 font-medium text-sm text-vscode-descriptionForeground">
								{t("chat:modeSelector.title")}
							</h4>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}

export default ModeSelector
