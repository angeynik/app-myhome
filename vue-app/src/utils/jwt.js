// utils/jwt.js
// Декодер JWT для клиента. Используется только для чтения exp —
// подпись проверяет сервер.

export function decodeJWT(token) {
  try {
    if (typeof token !== 'string') return null;
    const payload = token.split('.')[1];
    if (!payload) return null;

    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4); // base64url без паддинга

    // UTF-8 безопасно, без deprecated escape()
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function getTokenExpiry(token) {
  const p = decodeJWT(token);
  return p?.exp ? p.exp * 1000 : null;
}
