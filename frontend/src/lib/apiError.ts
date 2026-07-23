import { AxiosError } from 'axios'

/**
 * Shared API error parser.
 *
 * FastAPI `detail` can be:
 *   - string           → e.g. "Incorrect email or password."
 *   - object[]         → 422 validation errors [{type, loc, msg, input}]
 *   - object           → {msg: "..."}
 *
 * This function ALWAYS returns a plain string — never an object or array —
 * preventing the "Objects are not valid as a React child" crash.
 */
export function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof AxiosError)) {
    return 'An unexpected error occurred.'
  }

  const status = error.response?.status
  const detail = error.response?.data?.detail

  // ── Status code shortcuts ────────────────────────────────────────────────
  // IMPORTANT: For codes where the backend sends a specific detail message
  // (402, 429, 502, 503, 504), we fall through to the detail-parsing logic below
  // so the user sees the exact error (e.g. "insufficient credits") rather than a
  // generic string.  Only use hardcoded strings for codes whose detail is never
  // meaningful to the end user (401 → always re-login, 413 → always file size).
  if (status === 401) return 'Session expired. Please log in again.'
  if (status === 413) return 'File exceeds the 5 MB maximum size.'
  if (status === 403 && !detail) return 'You do not have permission to perform this action.'

  if (!detail) {
    return error.message || 'Something went wrong. Please try again.'
  }

  // ── Plain string ─────────────────────────────────────────────────────────
  if (typeof detail === 'string') return detail

  // ── 422 Validation error array [{type, loc, msg, input}, ...] ───────────
  if (Array.isArray(detail)) {
    const first = detail[0]
    if (first && typeof first === 'object' && 'msg' in first) {
      const loc: string[] = Array.isArray(first.loc) ? first.loc : []
      const field = loc.filter((s: string) => s !== 'body').join(' → ')
      const msg = String(first.msg)

      // Map common field/message combos to friendly copy
      if (loc.includes('file') || field === 'file') {
        if (/missing|required/i.test(msg)) return 'Resume file is required. Please select a PDF to upload.'
      }
      if (/pdf/i.test(msg)) return 'Only PDF files are supported.'
      if (/size|large|5\s*mb/i.test(msg)) return 'File exceeds maximum size. Please upload a PDF under 5 MB.'
      if (/email/i.test(field)) return 'Please enter a valid email address.'
      if (/password/i.test(field)) return 'Password must be at least 8 characters.'

      return field ? `${field}: ${msg}` : msg
    }

    // Fallback: join all msgs from the array
    return detail
      .map((d) => (typeof d === 'object' && d !== null && 'msg' in d ? String((d as { msg: unknown }).msg) : String(d)))
      .filter(Boolean)
      .join('; ')
  }

  // ── Object with message key ──────────────────────────────────────────────
  if (typeof detail === 'object' && detail !== null) {
    if ('msg' in detail) return String((detail as { msg: unknown }).msg)
    if ('message' in detail) return String((detail as { message: unknown }).message)
    return 'Something went wrong. Please try again.'
  }

  return String(detail)
}
