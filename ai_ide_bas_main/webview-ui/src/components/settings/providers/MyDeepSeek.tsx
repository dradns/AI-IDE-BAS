import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"

import type { ProviderSettings } from "@roo-code/types"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"

import { inputEventTransform } from "../transforms"

type MyDeepSeekProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
}

export const MyDeepSeek = ({ apiConfiguration, setApiConfigurationField }: MyDeepSeekProps) => {
	const { t } = useAppTranslation()

	const handleInputChange = useCallback(
		<K extends keyof ProviderSettings, E>(
			field: K,
			transform: (event: E) => ProviderSettings[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	return (
		<>
			<VSCodeTextField
				value={apiConfiguration?.myDeepSeekApiKey || ""}
				type="password"
				onInput={handleInputChange("myDeepSeekApiKey")}
				placeholder={t("settings:placeholders.apiKey")}
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.myDeepSeekApiKey")}</label>
			</VSCodeTextField>
			<div className="text-sm -mt-2">
				<a
					className="link"
					href="#"
					onClick={(e) => {
						e.preventDefault()
						const w: any = window as any
						if (w.vscode && typeof w.vscode.postMessage === "function") {
							w.vscode.postMessage({ type: "openExternal", url: "https://platform.deepseek.com/" })
						} else {
							window.open("https://platform.deepseek.com/", "_blank")
						}
					}}
				>
					Купить API ключ DeepSeek
				</a>
			</div>
			<div className="text-sm text-vscode-descriptionForeground -mt-2">
				{t("settings:providers.apiKeyStorageNotice")}
			</div>
			<VSCodeTextField
				value={apiConfiguration?.myDeepSeekBaseUrl || "https://api.aiidebas.com/api/v1"}
				onInput={handleInputChange("myDeepSeekBaseUrl")}
				placeholder="https://api.aiidebas.com/api/v1"
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.myDeepSeekBaseUrl")}</label>
			</VSCodeTextField>
			<div className="text-sm text-vscode-descriptionForeground -mt-2">
				{t("settings:providers.myDeepSeekBaseUrlDescription")}
			</div>
			{!apiConfiguration?.myDeepSeekApiKey && (
				<VSCodeButtonLink href="https://platform.deepseek.com/" appearance="secondary">
					{t("settings:providers.getDeepSeekApiKey")}
				</VSCodeButtonLink>
			)}
		</>
	)
}
