package uz.mirikdev.open_birdarcha.telegram;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import uz.mirikdev.open_birdarcha.auth.AppUserDao;
import uz.mirikdev.open_birdarcha.auth.LoginSessionStore;
import uz.mirikdev.open_birdarcha.service.AuthService;

import java.util.HashMap;
import java.util.Map;

/**
 * Telegram bot'ni long-polling orqali tinglaydi (webhook/tunnel shart emas — localhost'da ham ishlaydi).
 * /start &lt;nonce&gt; → kontakt so'rash; kontakt ulashilganda → token chiqarib sessiyani tasdiqlash.
 */
@Component
public class TelegramBotPoller {

    private static final Logger log = LoggerFactory.getLogger(TelegramBotPoller.class);

    private final TelegramClient tg;
    private final LoginSessionStore sessions;
    private final AuthService auth;
    private final AppUserDao appUsers;

    private volatile boolean running = false;
    private long offset = 0;

    public TelegramBotPoller(TelegramClient tg, LoginSessionStore sessions, AuthService auth, AppUserDao appUsers) {
        this.tg = tg;
        this.sessions = sessions;
        this.auth = auth;
        this.appUsers = appUsers;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!tg.isEnabled()) {
            log.warn("TELEGRAM_BOT_TOKEN berilmagan — Telegram login o'chirilgan.");
            return;
        }
        // Token/ulanishni darrov tekshiramiz — startup'da yaqqol "ishlayapti/yo'q" signali.
        verifyConnection();
        // Webhook o'rnatilgan bo'lsa polling bilan ziddiyatga (409) tushadi — startup'da tozalaymiz.
        try {
            tg.deleteWebhook();
            log.info("Telegram webhook tozalandi — polling rejimi.");
        } catch (Exception e) {
            log.warn("deleteWebhook xato (e'tiborsiz qoldiramiz): {}", e.getMessage());
        }
        running = true;
        Thread t = new Thread(this::loop, "tg-poller");
        t.setDaemon(true);
        t.start();
        log.info("Telegram bot poller ishga tushdi.");
    }

    /**
     * Telegram'ga ulanishni getMe orqali tekshiradi va natijani logga yozadi.
     * Muvaffaqiyatda true (bot ma'lumoti chiqadi), aks holda false (token/tarmoq muammosi).
     */
    boolean verifyConnection() {
        try {
            JsonNode me = tg.getMe();
            if (me != null && me.path("ok").asBoolean(false)) {
                JsonNode r = me.path("result");
                log.info("Telegram ulanish OK — bot @{} (id={})",
                        r.path("username").asText("?"), r.path("id").asLong());
                return true;
            }
            log.error("Telegram getMe muvaffaqiyatsiz (ok=false): {} — TELEGRAM_BOT_TOKEN to'g'rimi?",
                    me == null ? "javob yo'q" : me.path("description").asText("noma'lum xato"));
            return false;
        } catch (Exception e) {
            log.error("Telegram'ga ulanib bo'lmadi (getMe): {} — token/tarmoqni tekshiring.", e.getMessage());
            return false;
        }
    }

    private void loop() {
        while (running) {
            try {
                JsonNode resp = tg.getUpdates(offset, 30);
                for (JsonNode upd : resp.path("result")) {
                    offset = upd.path("update_id").asLong() + 1;
                    handle(upd);
                }
            } catch (HttpClientErrorException.Conflict e) {
                // 409: aynan shu token bilan boshqa getUpdates ulanishi bor.
                log.warn("getUpdates 409 Conflict — shu bot token bilan boshqa getUpdates ulanishi faol. "
                        + "Sabablari: eski/ikkinchi instans ishlayapti, qayta ishga tushishda eski long-poll "
                        + "hali uzilmagan, yoki webhook qaytadan o'rnatilgan. Webhookni tozalab, qayta urinamiz...");
                try {
                    tg.deleteWebhook();
                } catch (Exception ignored) {
                    // tozalash imkoni bo'lmasa — keyingi urinishda davom etamiz
                }
                sleep(5000);
            } catch (Exception e) {
                log.warn("getUpdates xato: {}", e.getMessage());
                sleep(3000);
            }
        }
    }

    private void handle(JsonNode upd) {
        JsonNode msg = upd.path("message");
        if (msg.isMissingNode()) {
            return;
        }
        long chatId = msg.path("chat").path("id").asLong();
        JsonNode from = msg.path("from");

        // 1-qadam: /start <nonce>
        String text = msg.path("text").asText("");
        if (text.startsWith("/start")) {
            String[] parts = text.split("\\s+", 2);
            String nonce = parts.length > 1 ? parts[1].trim() : "";
            if (sessions.exists(nonce)) {
                sessions.linkChat(chatId, nonce);
                log.info("Login boshlandi: chatId={}, nonce={}", chatId, nonce);
                tg.sendMessage(chatId,
                        "Open Birdarcha'ga kirish uchun telefon raqamingizni ulashing 👇",
                        TelegramClient.contactKeyboard("📱 Raqamni ulashish"));
            } else {
                log.info("/start: eskirgan/yaroqsiz nonce (chatId={}, nonce='{}')", chatId, nonce);
                tg.sendMessage(chatId, "Havola eskirgan. Saytdagi tugma orqali qaytadan kiring.", null);
            }
            return;
        }

        // 2-qadam: kontakt ulashildi
        JsonNode contact = msg.path("contact");
        if (!contact.isMissingNode()) {
            String nonce = sessions.takeNonceForChat(chatId);
            if (nonce == null || !sessions.exists(nonce)) {
                log.warn("Kontakt keldi, lekin faol sessiya yo'q (chatId={})", chatId);
                tg.sendMessage(chatId, "Sessiya topilmadi. Saytdan qaytadan kiring.", TelegramClient.removeKeyboard());
                return;
            }
            long fromId = from.path("id").asLong();
            // Faqat o'z raqamini (boshqa kontaktni emas) qabul qilamiz.
            if (contact.path("user_id").asLong(0) != fromId) {
                log.info("O'zga raqam ulashildi (chatId={}) — rad etildi", chatId);
                tg.sendMessage(chatId, "Iltimos, tugma orqali o'z raqamingizni ulashing.", null);
                sessions.linkChat(chatId, nonce); // qayta urinish uchun bog'lashni tiklaymiz
                return;
            }

            Map<String, Object> user = new HashMap<>();
            user.put("id", fromId);
            user.put("first_name", textOrNull(from, "first_name"));
            user.put("last_name", textOrNull(from, "last_name"));
            user.put("username", textOrNull(from, "username"));
            user.put("phone", contact.path("phone_number").asText(null));
            user.put("photo", tg.fetchPhotoDataUri(fromId));

            String token = auth.issueToken(user);
            sessions.confirm(nonce, user, token);
            log.info("✅ Login: id={}, first={}, last={}, username={}, tel={}",
                    user.get("id"), user.get("first_name"), user.get("last_name"),
                    user.get("username"), user.get("phone"));
            // Foydalanuvchini DB'ga yozamiz/yangilaymiz (audit). DB xato bo'lsa ham login buzilmaydi.
            try {
                appUsers.upsertOnLogin(fromId,
                        (String) user.get("first_name"), (String) user.get("last_name"),
                        (String) user.get("username"), (String) user.get("phone"));
            } catch (Exception e) {
                log.warn("app_user upsert xato (login davom etadi): {}", e.getMessage());
            }

            // Muvaffaqiyat xabari + "Saytga qaytish". Avval inline tugma sinaladi (real https domen uchun ideal);
            // Telegram URL'ni rad etsa (localhost/IP) — havola matn ko'rinishida yuboriladi.
            LoginSessionStore.Session sess = sessions.get(nonce);
            String origin = sess == null ? null : sess.origin;
            boolean buttonSent = false;
            if (origin != null && !origin.isBlank()) {
                try {
                    tg.sendMessage(chatId, "✅ Muvaffaqiyatli kirdingiz! Saytga qaytishingiz mumkin.",
                            TelegramClient.inlineUrlKeyboard("🔙 Saytga qaytish", origin));
                    buttonSent = true;
                } catch (Exception e) {
                    log.warn("Inline 'Saytga qaytish' tugmasi rad etildi ({}) — matnli havolaga o'tamiz: {}",
                            origin, e.getMessage());
                }
            }
            if (!buttonSent) {
                String okText = (origin != null && !origin.isBlank())
                        ? "✅ Muvaffaqiyatli kirdingiz! Saytga qayting: " + origin
                        : "✅ Muvaffaqiyatli kirdingiz! Brauzerga qaytsangiz — avtomatik kirasiz.";
                tg.sendMessage(chatId, okText, TelegramClient.removeKeyboard());
            }
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode v = node.path(field);
        return v.isMissingNode() || v.isNull() ? null : v.asText();
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
