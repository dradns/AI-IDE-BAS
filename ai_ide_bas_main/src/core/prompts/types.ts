/**
 * Settings passed to system prompt generation functions
 */
export interface SystemPromptSettings {
	maxConcurrentFileReads: number
	todoListEnabled: boolean
	useAgentRules: boolean
	useRooRulesOnly?: boolean // Если true - системный промпт + все секции + правила из .roo, БЕЗ USER'S CUSTOM INSTRUCTIONS. Если false/undefined - системный промпт + все секции + USER'S CUSTOM INSTRUCTIONS, БЕЗ правил из .roo
}
