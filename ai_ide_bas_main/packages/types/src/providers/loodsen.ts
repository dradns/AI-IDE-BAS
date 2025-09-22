
import type { ModelInfo } from "../model.js"
// Loodsen AI
// https://ai.ldsn.ru (OpenAI compatible)
export type LoodsenModelId = "Qwen/Qwen2.5-32B"

export const loodsenDefaultModelId: LoodsenModelId = "Qwen/Qwen2.5-32B"

export const loodsenModels = {
  "Qwen/Qwen2.5-32B": {
    maxTokens: 32768,
    contextWindow: 40960,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0,
    outputPrice: 0,
    description: "Qwen2.5 32B model.",
  }
} as const satisfies Record<string, ModelInfo>