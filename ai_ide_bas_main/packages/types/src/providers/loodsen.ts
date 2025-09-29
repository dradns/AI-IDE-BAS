
import type { ModelInfo } from "../model.js"
// Loodsen AI
// https://ai.ldsn.ru (OpenAI compatible)
export const loodsenDefaultModelId = "qwen2.5-coder:32b"

export type LoodsenModelId = typeof loodsenDefaultModelId;

export const loodsenModels = {
  [loodsenDefaultModelId]: {
    maxTokens: 32768,
    contextWindow: 40960,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
    description: "Qwen2.5 32B model.",
  }
} as const satisfies Record<string, ModelInfo>