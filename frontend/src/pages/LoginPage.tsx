import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  isTelegramStartValid,
  pollTelegramLogin,
  startTelegramLogin,
  takeRedirect,
  TelegramLoginStart,
} from "../auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { authenticated, setSession } = useAuth();
  const [start, setStart] = useState<TelegramLoginStart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  // Allaqachon kirilgan bo'lsa — bosh sahifaga.
  useEffect(() => {
    if (authenticated) navigate("/", { replace: true });
  }, [authenticated, navigate]);

  // Login sessiyasini boshlaymiz.
  useEffect(() => {
    let alive = true;
    startTelegramLogin()
      .then((s) => {
        if (!alive) return;
        setStart(s);
        // botUsername/token bo'sh bo'lsa — telegram.org ga urinmasdan darrov ogohlantiramiz.
        if (!isTelegramStartValid(s)) {
          setError(
            s.reason
              ? `Telegram login sozlanmagan: ${s.reason}. Backend .env o'qiyaptimi?`
              : "Bot sozlanmagan — Telegram login ishlamaydi. Administrator bilan bog'laning."
          );
        }
      })
      .catch(() => alive && setError("Login boshlanmadi. Backend ishlayaptimi?"));
    return () => {
      alive = false;
    };
  }, []);

  // nonce bo'lsa — CONFIRMED bo'lguncha so'roqlaymiz.
  useEffect(() => {
    if (!start) return;
    let alive = true;
    const id = setInterval(async () => {
      try {
        const r = await pollTelegramLogin(start.nonce);
        if (!alive) return;
        if (r.status === "CONFIRMED" && r.token && r.user) {
          clearInterval(id);
          setSession({ token: r.token, user: r.user });
          navigate(takeRedirect(), { replace: true });
        } else if (r.status === "EXPIRED") {
          clearInterval(id);
          const fresh = await startTelegramLogin();
          if (alive) setStart(fresh);
        }
      } catch {
        /* keyingi tick'da qayta urinadi */
      }
    }, 2500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [start, navigate, setSession]);

  function openTelegram() {
    if (!start) return;
    // Himoya: botUsername bo'sh / deepLink yaroqsiz bo'lsa foydalanuvchini telegram.org ga YUBORMAYMIZ.
    if (!isTelegramStartValid(start) || !start.deepLink) {
      setError(
        start.reason
          ? `Bot sozlanmagan: ${start.reason}`
          : "Bot sozlanmagan — Telegram login ishlamaydi. Administrator bilan bog'laning (backend .env: TELEGRAM_BOT_USERNAME)."
      );
      return;
    }
    setError(null);
    setWaiting(true);
    window.open(start.deepLink, "_blank", "noopener");
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <span className="tg-mark">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path
              d="M21.9 4.3 18.7 19.6c-.24 1.07-.88 1.33-1.78.83l-4.9-3.62-2.37 2.28c-.26.26-.48.48-.99.48l.35-5 9.1-8.22c.4-.35-.09-.55-.62-.2L5.24 13.1l-4.85-1.52c-1.05-.33-1.07-1.05.22-1.55L20.55 2.8c.88-.32 1.65.2 1.35 1.5Z"
              fill="#fff"
            />
          </svg>
        </span>
        <h1>Open Birdarcha</h1>
        <p className="muted login-sub">
          Biznes aloqalari va affillik tahlili. Davom etish uchun Telegram orqali kiring.
        </p>

        {error && <p className="red">{error}</p>}

        {waiting ? (
          <div className="login-status">
            <span className="login-spinner" />
            <p className="muted">
              Telegram'da <b>telefon raqamingizni ulashing</b> — bu sahifa avtomatik davom etadi.
            </p>
            <button className="link-btn" onClick={openTelegram}>
              Telegram ochilmadimi? Qayta ochish
            </button>
          </div>
        ) : (
          <button className="tg-btn" disabled={!start} onClick={openTelegram}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21.9 4.3 18.7 19.6c-.24 1.07-.88 1.33-1.78.83l-4.9-3.62-2.37 2.28c-.26.26-.48.48-.99.48l.35-5 9.1-8.22c.4-.35-.09-.55-.62-.2L5.24 13.1l-4.85-1.52c-1.05-.33-1.07-1.05.22-1.55L20.55 2.8c.88-.32 1.65.2 1.35 1.5Z"
                fill="currentColor"
              />
            </svg>
            {start ? "Telegram orqali kirish" : "Tayyorlanmoqda…"}
          </button>
        )}
      </div>
    </div>
  );
}
