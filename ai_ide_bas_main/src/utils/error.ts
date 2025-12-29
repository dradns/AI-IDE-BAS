/**
 * Safely extracts error message from unknown error type
 */
export const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message
	}
	if (typeof error === "string") {
		return error
	}
	if (error && typeof error === "object" && "message" in error) {
		return String((error as { message: unknown }).message)
	}
	return String(error)
}

/**
 * Type guard to check if error has a specific code property (e.g., ECONNREFUSED)
 */
export const hasErrorCode = (error: unknown, code: string): boolean => {
	return (
		error !== null &&
		typeof error === "object" &&
		"code" in error &&
		(error as { code: unknown }).code === code
	)
}

/**
 * Converts unknown error to Error object
 */
export const toError = (error: unknown): Error => {
	if (error instanceof Error) {
		return error
	}
	return new Error(getErrorMessage(error))
}

