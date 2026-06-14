package uz.mirikdev.open_birdarcha.auth;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Telegram login sessiyalari (xotirada). Oqim:
 *  1) sayt create() bilan nonce oladi va /start nonce havolasini ko'rsatadi.
 *  2) bot /start nonce kelganda linkChat() bilan chat'ni nonce'ga bog'laydi.
 *  3) foydalanuvchi kontaktini ulashganda confirm() — user+token saqlanadi.
 *  4) sayt poll() bilan CONFIRMED bo'lguncha tekshiradi.
 *
 * <p>Sessiyalar qisqa umrli (login paytida); ilova qayta ishga tushsa yo'qoladi — bu normal.
 */
@Component
public class LoginSessionStore {

    public enum Status { PENDING, CONFIRMED }

    public static final class Session {
        public volatile Status status = Status.PENDING;
        public volatile Map<String, Object> user;
        public volatile String token;
        public volatile String origin; // saytning origin'i — bot "Saytga qaytish" tugmasi uchun
        public final long createdAt = System.currentTimeMillis();
    }

    private static final long TTL_MS = 10 * 60 * 1000L; // 10 daqiqa

    private final Map<String, Session> byNonce = new ConcurrentHashMap<>();
    private final Map<Long, String> nonceByChat = new ConcurrentHashMap<>();

    public String create(String origin) {
        sweep();
        String nonce = UUID.randomUUID().toString().replace("-", "");
        Session s = new Session();
        s.origin = origin;
        byNonce.put(nonce, s);
        return nonce;
    }

    public boolean exists(String nonce) {
        return nonce != null && byNonce.containsKey(nonce);
    }

    public void linkChat(long chatId, String nonce) {
        if (exists(nonce)) {
            nonceByChat.put(chatId, nonce);
        }
    }

    /** Chat uchun bog'langan nonce'ni qaytaradi va olib tashlaydi (bir martalik). */
    public String takeNonceForChat(long chatId) {
        return nonceByChat.remove(chatId);
    }

    public void confirm(String nonce, Map<String, Object> user, String token) {
        Session s = byNonce.get(nonce);
        if (s != null) {
            s.user = user;
            s.token = token;
            s.status = Status.CONFIRMED;
        }
    }

    public Session get(String nonce) {
        return nonce == null ? null : byNonce.get(nonce);
    }

    public void remove(String nonce) {
        byNonce.remove(nonce);
    }

    private void sweep() {
        long now = System.currentTimeMillis();
        byNonce.entrySet().removeIf(e -> now - e.getValue().createdAt > TTL_MS);
    }
}
