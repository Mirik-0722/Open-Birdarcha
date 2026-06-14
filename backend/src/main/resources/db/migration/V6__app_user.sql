-- Telegram orqali kirgan foydalanuvchilar (audit + kelajakda rol/bloklash uchun).
-- "user" Postgres'da zaxira so'z — shuning uchun jadval nomi app_user.
CREATE TABLE app_user (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id   BIGINT UNIQUE NOT NULL,
    first_name    TEXT,
    last_name     TEXT,
    username      TEXT,
    phone         TEXT,
    role          VARCHAR(20) NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'admin')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
