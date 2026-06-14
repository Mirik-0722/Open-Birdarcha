package uz.mirikdev.open_birdarcha.auth;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * app_user jadvali bilan ishlaydi (loyiha uslubiga mos — JdbcClient).
 * Telegram login'da foydalanuvchini yozadi/yangilaydi.
 */
@Repository
public class AppUserDao {

    private final JdbcClient jdbc;

    public AppUserDao(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Telegram login'da upsert: yangi foydalanuvchi bo'lsa qo'shadi, bo'lsa ma'lumotini
     * va last_login_at ni yangilaydi. telegram_id — barqaror tabiiy kalit.
     */
    public void upsertOnLogin(long telegramId, String firstName, String lastName,
                              String username, String phone) {
        jdbc.sql("""
                INSERT INTO app_user (telegram_id, first_name, last_name, username, phone, last_login_at)
                VALUES (:tid, :first, :last, :username, :phone, now())
                ON CONFLICT (telegram_id) DO UPDATE SET
                    first_name    = COALESCE(EXCLUDED.first_name, app_user.first_name),
                    last_name     = COALESCE(EXCLUDED.last_name, app_user.last_name),
                    username      = COALESCE(EXCLUDED.username, app_user.username),
                    phone         = COALESCE(EXCLUDED.phone, app_user.phone),
                    last_login_at = now()
                """)
                .param("tid", telegramId)
                .param("first", firstName)
                .param("last", lastName)
                .param("username", username)
                .param("phone", phone)
                .update();
    }
}
