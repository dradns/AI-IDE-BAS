export interface Role {
	/** Unique identifier of the role (used internally). */
	slug: string
	/** Human-friendly name shown to the user. */
	name: string
	/** Short description of what this role is responsible for. */
	description: string
}

/**
 * Pre-configured roles for AI IDE BAS. Prompts / instructions are intentionally
 * left out – they will be provided later by the user.
 */
export const roles: readonly Role[] = [
	{
		slug: "ba",
		name: "📋 BA (Business Analyst)",
		description:
			"Responsible for generating requirements (User Story, Use Case, Activity Diagram, Acceptance Criteria).",
	},
	{
		slug: "architect",
		name: "🏗️ Architect",
		description: "Generates architectural documents (currently: component diagram).",
	},
	{
		slug: "sa",
		name: "📝 SA (System Analyst)",
		description: "Prepares system analysis documents.",
	},
	{
		slug: "review",
		name: "🔍 Review (Reviewer)",
		description: "Reviews architecture, security, maintainability and senior-level system analysis documents.",
	},
] as const

export type RoleSlug = (typeof roles)[number]["slug"]
