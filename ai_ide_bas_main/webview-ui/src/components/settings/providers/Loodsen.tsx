import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"

import type { ProviderSettings } from "@roo-code/types"

import { useAppTranslation } from "@src/i18n/TranslationContext"

import { inputEventTransform } from "../transforms"
import { VSCodeButtonLink } from "@/components/common/VSCodeButtonLink"

type LoodsenProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
}

export const Loodsen = ({ apiConfiguration, setApiConfigurationField }: LoodsenProps) => {
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
        value={apiConfiguration?.loodsenBaseUrl || ""}
        type="url"
        onInput={handleInputChange("loodsenBaseUrl")}
        placeholder={t("settings:defaults.loodsenUrl")}
        className="w-full">
        <label className="block font-medium mb-1">{t("settings:providers.loodsen.baseUrl")}</label>
      </VSCodeTextField>
      <VSCodeTextField
        value={apiConfiguration?.loodsenApiKey || ""}
        type="password"
        onInput={handleInputChange("loodsenApiKey")}
        placeholder={t("settings:placeholders.apiKey")}
        className="w-full">
        <label className="block font-medium mb-1">{t("settings:providers.loodsenApiKey")}</label>
      </VSCodeTextField>
      <div className="text-sm text-vscode-descriptionForeground -mt-2">
        {t("settings:providers.apiKeyStorageNotice")}
      </div>
      {!apiConfiguration?.loodsenApiKey && (
        <VSCodeButtonLink href="https://ai.ldsn.ru" appearance="secondary">
          {t("settings:providers.getLoodsenApiKey")}
        </VSCodeButtonLink>
      )}
    </>
  )
}
