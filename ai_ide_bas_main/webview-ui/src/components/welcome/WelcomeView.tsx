import { useCallback, useEffect, useState } from "react"
// import knuthShuffle from "knuth-shuffle-seeded"
import { Trans } from "react-i18next"
import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"

import type { ProviderSettings } from "@roo-code/types"
import { deepSeekDefaultModelId } from "@roo-code/types"

import { useExtensionState } from "@src/context/ExtensionStateContext"
import { validateApiConfiguration } from "@src/utils/validate"
import { vscode } from "@src/utils/vscode"
import { useAppTranslation } from "@src/i18n/TranslationContext"
// import { getRequestyAuthUrl, getOpenRouterAuthUrl } from "@src/oauth/urls"

import ApiOptions from "../settings/ApiOptions"
import { Tab, TabContent } from "../common/Tab"

import RooHero from "./RooHero"
import RooCloudCTA from "./RooCloudCTA"

const WelcomeView = () => {
	const { apiConfiguration, currentApiConfigName, setApiConfiguration, uriScheme } = useExtensionState()
	const { t } = useAppTranslation()
	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

	// Memoize the setApiConfigurationField function to pass to ApiOptions
	const setApiConfigurationFieldForApiOptions = useCallback(
		<K extends keyof ProviderSettings>(field: K, value: ProviderSettings[K]) => {
			setApiConfiguration({ [field]: value })
		},
		[setApiConfiguration], // setApiConfiguration from context is stable
	)

	const handleSubmit = useCallback(() => {
		// Soft-validate but do not block start. Always proceed on click.
		const error = apiConfiguration ? validateApiConfiguration(apiConfiguration) : undefined
		if (error) {
			setErrorMessage(error)
		} else {
			setErrorMessage(undefined)
		}
		vscode.postMessage({ type: "upsertApiConfiguration", text: currentApiConfigName, apiConfiguration })
	}, [apiConfiguration, currentApiConfigName])

	// Using a lazy initializer so it reads once at mount
	// const [imagesBaseUri] = useState(() => {
	// 	const w = window as any
	// 	return w.IMAGES_BASE_URI || ""
	// })

	// Ensure DeepSeek is preselected on the welcome screen if no provider is chosen yet
	useEffect(() => {
		if (!apiConfiguration?.apiProvider) {
			setApiConfiguration({ apiProvider: "deepseek", apiModelId: deepSeekDefaultModelId })
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [apiConfiguration?.apiProvider])

	return (
		<Tab>
			<TabContent className="flex flex-col gap-5 p-16">
				<RooHero />
				<RooCloudCTA />
				<h2 className="mt-0 mb-0">{t("welcome:greeting")}</h2>

				<div className="font-bold">
					<p>
						<Trans i18nKey="welcome:introduction" />
					</p>
					<p>
						<Trans i18nKey="welcome:chooseProvider" />
					</p>
				</div>

				<div className="mb-4">
					<p className="font-bold mt-0 mb-6">{t("welcome:startCustom")}</p>
					<ApiOptions
						fromWelcomeView
						apiConfiguration={apiConfiguration || {}}
						uriScheme={uriScheme}
						setApiConfigurationField={setApiConfigurationFieldForApiOptions}
						errorMessage={errorMessage}
						setErrorMessage={setErrorMessage}
					/>
				</div>
			</TabContent>
			<div className="sticky bottom-0 bg-vscode-sideBar-background p-5">
				<div className="flex flex-col gap-1">
					<div className="flex justify-end">
						<VSCodeLink
							href="#"
							onClick={(e) => {
								e.preventDefault()
								vscode.postMessage({ type: "importSettings" })
							}}
							className="text-sm">
							{t("welcome:importSettings")}
						</VSCodeLink>
					</div>
					<VSCodeButton onClick={handleSubmit} appearance="primary">
						{t("welcome:start")}
					</VSCodeButton>
					{errorMessage && <div className="text-vscode-errorForeground">{errorMessage}</div>}
				</div>
			</div>
		</Tab>
	)
}

export default WelcomeView
