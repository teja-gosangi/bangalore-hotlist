export async function readFunctionErrorMessage(
  error: { message: string; context?: Response } | null,
  data: { error?: string } | null | undefined,
): Promise<string> {
  if (data?.error) return data.error

  if (error?.context) {
    try {
      const parsed = (await error.context.json()) as { error?: string }
      if (parsed.error) return parsed.error
    } catch {
      // ignore parse errors
    }
  }

  return error?.message || 'Could not submit nomination. Try again.'
}
