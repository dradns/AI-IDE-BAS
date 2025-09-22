import { LoodsenModelId, loodsenDefaultModelId, loodsenModels } from "@roo-code/types"

import type { ApiHandlerOptions } from "../../shared/api"
import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"

export class LoodsenHandler extends BaseOpenAiCompatibleProvider<LoodsenModelId> {
    constructor(options: ApiHandlerOptions) {
      super({
        ...options,
        providerName: "Loodsen AI",
        baseURL: options.loodsenBaseUrl || "https://ai.ldsn.ru/api",
        apiKey: options.loodsenApiKey,
        defaultProviderModelId: loodsenDefaultModelId,
        providerModels: loodsenModels,
        defaultTemperature: 0.5,
      })
    }
}
