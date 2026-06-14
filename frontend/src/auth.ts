// Auth holati va Telegram login oqimi uchun yordamchilar (React'siz — api.ts ham ishlatadi).

const TOKEN_KEY = "ob_token";
const USER_KEY = "ob_user";
// ProtectedRoute kirishga urinilgan sahifani shu yerga saqlaydi (login'dan keyin qaytish uchun).
const REDIRECT_KEY = "ob_redirect";

// Telegram bot beradigan foydalanuvchi ma'lumoti (backend shuni 'user' qilib qaytaradi).
export interface AuthUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  photo?: string | null; // data-URI yoki null
  [k: string]: any;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/** Header'da ko'rsatish uchun foydalanuvchi ismi. */
export function userDisplayName(u: AuthUser | null): string {
  if (!u) return "Foydalanuvchi";
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return name || (u.username ? `@${u.username}` : "Foydalanuvchi");
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeAuth(r: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, r.token);
  localStorage.setItem(USER_KEY, JSON.stringify(r.user ?? {}));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setRedirect(path: string): void {
  sessionStorage.setItem(REDIRECT_KEY, path);
}

export function takeRedirect(): string {
  const path = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return path || "/";
}

// ---- Telegram login API ----

export interface TelegramLoginStart {
  nonce: string;
  botUsername: string;
  deepLink: string | null;
  configured?: boolean; // false bo'lsa: bot username/token sozlanmagan
  reason?: string; // configured:false sababi (inson o'qiy oladigan)
}

/**
 * start javobi yaroqlimi — botUsername bor, deepLink real botga ishora qiladi va backend configured:false demagan.
 * botUsername bo'sh bo'lsa deepLink "https://t.me/?start=..." bo'lib, brauzer telegram.org ga ketadi — bunga yo'l qo'ymaymiz.
 */
export function isTelegramStartValid(s: TelegramLoginStart | null): boolean {
  if (!s) return false;
  if (s.configured === false) return false;
  const link = (s.deepLink ?? "").trim();
  if (!s.botUsername || s.botUsername.trim() === "") return false;
  if (!link.startsWith("https://t.me/")) return false;
  if (link.startsWith("https://t.me/?")) return false;
  return true;
}

export interface PollResult {
  status: "PENDING" | "CONFIRMED" | "EXPIRED";
  token?: string;
  user?: AuthUser;
}

/** Login sessiyasini boshlaydi — nonce + bot deep-link qaytaradi. origin bot "Saytga qaytish" tugmasi uchun. */
export async function startTelegramLogin(): Promise<TelegramLoginStart> {
  const origin = encodeURIComponent(window.location.origin);
  const res = await fetch(`/api/auth/telegram/start?origin=${origin}`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`start failed: HTTP ${res.status}`);
  }
  return res.json() as Promise<TelegramLoginStart>;
}

/** Sessiya holatini tekshiradi (CONFIRMED bo'lsa token+user keladi). */
export async function pollTelegramLogin(nonce: string): Promise<PollResult> {
  const res = await fetch(`/api/auth/telegram/poll?nonce=${encodeURIComponent(nonce)}`);
  if (!res.ok) {
    throw new Error(`poll failed: HTTP ${res.status}`);
  }
  return res.json() as Promise<PollResult>;
}
