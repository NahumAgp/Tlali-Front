import { API_URL } from '../config/app.js'

export async function loadCurrentUser(token) {
  const response = await authorizedFetch(`${API_URL}/api/v1/auth/me`, token)
  if (!response.ok) throw new Error('Invalid session')
  return response.json()
}

export async function authorizedFetch(url, token, options = {}, onUnauthorized) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401 && onUnauthorized) onUnauthorized()
  return response
}

function getTokenPayload(token) {
  try {
    const [, payload] = token.split('.')
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      window.atob(base64).split('').map((character) =>
        `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`,
      ).join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function isTokenExpired(token) {
  const payload = getTokenPayload(token)
  return !payload?.exp || payload.exp * 1000 <= Date.now()
}

export function getTokenExpirationDelay(token) {
  const payload = getTokenPayload(token)
  return payload?.exp ? Math.max(payload.exp * 1000 - Date.now(), 0) : null
}
