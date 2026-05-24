/**
 * Hedge error handling utilities
 */

export function buildHedgeErrorHeadline(error: string): string {
  if (!error) return 'Unknown error'
  
  // Clean up common error patterns
  if (error.includes('ECONNREFUSED')) {
    return 'Hedge engine unreachable'
  }
  if (error.includes('timeout')) {
    return 'Hedge engine timeout'
  }
  if (error.includes('503')) {
    return 'Hedge engine unavailable'
  }
  if (error.includes('502')) {
    return 'Hedge engine error'
  }
  
  // Return the error message, truncated if too long
  return error.length > 80 ? `${error.substring(0, 77)}...` : error
}

export function classifyClientError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return 'Request cancelled'
    }
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      return 'Network error'
    }
    return err.message
  }
  
  return 'Unknown error'
}

export function normalizeHedgeError(error: string): string {
  return buildHedgeErrorHeadline(error)
}