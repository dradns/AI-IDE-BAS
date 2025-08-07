import { TelemetryService } from "@roo-code/telemetry"
import { TelemetryEventName } from "@roo-code/types"

/**
 * Утилиты для отправки событий телеметрии
 */
export class TelemetryHelpers {
	private static telemetryService: TelemetryService | null = null

	/**
	 * Инициализация сервиса телеметрии
	 */
	static init(telemetryService: TelemetryService) {
		this.telemetryService = telemetryService
	}

	/**
	 * Отправка события клика по кнопке навигации
	 */
	static trackNavigationButtonClick(buttonType: string, buttonText: string, buttonPosition?: string) {
		if (!this.telemetryService) return

		this.telemetryService.capture({
			event: TelemetryEventName.NAVIGATION_BUTTON_CLICKED,
			properties: {
				buttonType,
				buttonText,
				buttonPosition,
				destination: "external_link",
				timestamp: new Date().toISOString(),
			},
		})
	}

	/**
	 * Отправка события выбора режима
	 */
	static trackModeSelected(
		modeName: string,
		modeFullName: string,
		previousMode?: string,
		selectionMethod: "click" | "keyboard_shortcut" = "click",
		keyboardShortcut?: string,
	) {
		if (!this.telemetryService) return

		this.telemetryService.capture({
			event: TelemetryEventName.MODE_SELECTED,
			properties: {
				modeName,
				modeFullName,
				previousMode,
				selectionMethod,
				keyboardShortcut,
				timestamp: new Date().toISOString(),
			},
		})
	}

	/**
	 * Отправка события навигации по режимам
	 */
	static trackModeNavigation(
		navigationType: "next" | "previous",
		currentMode: string,
		targetMode: string,
		keyboardShortcut?: string,
	) {
		if (!this.telemetryService) return

		this.telemetryService.capture({
			event: TelemetryEventName.MODE_NAVIGATION,
			properties: {
				navigationType,
				currentMode,
				targetMode,
				keyboardShortcut,
				timestamp: new Date().toISOString(),
			},
		})
	}

	/**
	 * Отправка события доступа к маркетплейсу режимов
	 */
	static trackModeMarketplaceAccessed(accessMethod: "button_click" | "menu_navigation", currentMode?: string) {
		if (!this.telemetryService) return

		this.telemetryService.capture({
			event: TelemetryEventName.MODE_MARKETPLACE_ACCESSED,
			properties: {
				accessMethod,
				currentMode,
				timestamp: new Date().toISOString(),
			},
		})
	}

	/**
	 * Отправка события доступа к настройкам режимов
	 */
	static trackModeSettingsAccessed(currentMode?: string) {
		if (!this.telemetryService) return

		this.telemetryService.capture({
			event: TelemetryEventName.MODE_SETTINGS_ACCESSED,
			properties: {
				currentMode,
				timestamp: new Date().toISOString(),
			},
		})
	}

	/**
	 * Отправка события клика по кнопке YouTube
	 */
	static trackYouTubeButtonClick() {
		this.trackNavigationButtonClick("youtube_video", "AI IDE BAS - ИИ Агент для аналитиков", "top")
	}

	/**
	 * Отправка события клика по кнопке инструкций
	 */
	static trackInstructionsButtonClick() {
		this.trackNavigationButtonClick("instructions", "Инструкция по настройке", "bottom")
	}

	/**
	 * Отправка события выбора режима BA
	 */
	static trackBAModeSelected(previousMode?: string, selectionMethod?: "click" | "keyboard_shortcut") {
		this.trackModeSelected("BA", "Business Analyst", previousMode, selectionMethod)
	}

	/**
	 * Отправка события выбора режима Architect
	 */
	static trackArchitectModeSelected(previousMode?: string, selectionMethod?: "click" | "keyboard_shortcut") {
		this.trackModeSelected("Architect", "Architect", previousMode, selectionMethod)
	}

	/**
	 * Отправка события выбора режима SA
	 */
	static trackSAModeSelected(previousMode?: string, selectionMethod?: "click" | "keyboard_shortcut") {
		this.trackModeSelected("SA", "System Analyst", previousMode, selectionMethod)
	}

	/**
	 * Отправка события выбора режима Review
	 */
	static trackReviewModeSelected(previousMode?: string, selectionMethod?: "click" | "keyboard_shortcut") {
		this.trackModeSelected("Review", "Reviewer", previousMode, selectionMethod)
	}

	/**
	 * Отправка события выбора режима Designer
	 */
	static trackDesignerModeSelected(previousMode?: string, selectionMethod?: "click" | "keyboard_shortcut") {
		this.trackModeSelected("Designer", "Designer", previousMode, selectionMethod)
	}

	/**
	 * Отправка события выбора режима Helper
	 */
	static trackHelperModeSelected(previousMode?: string, selectionMethod?: "click" | "keyboard_shortcut") {
		this.trackModeSelected("Helper", "Helper", previousMode, selectionMethod)
	}
}
