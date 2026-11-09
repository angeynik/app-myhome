// utils/jwt.js
// Декодер JWT для клиента. Используется только для чтения exp/username —
// подпись проверяет сервер, клиенту это не нужно.

export function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return null;
  }
}

export function getTokenExpiry(token) {
  const p = decodeJWT(token);
  return p?.exp ? p.exp * 1000 : null;
}