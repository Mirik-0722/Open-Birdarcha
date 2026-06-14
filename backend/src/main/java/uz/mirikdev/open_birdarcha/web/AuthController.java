package uz.mirikdev.open_birdarcha.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import uz.mirikdev.open_birdarcha.auth.LoginSessionStore;
import uz.mirikdev.open_birdarcha.telegram.TelegramClient;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final LoginSessionStore sessions;
    private final TelegramClient tg;
    private final String botUsername;

    public AuthController(LoginSessionStore sessions,
                          TelegramClient tg,
                          @Value("${telegram.bot-username:}") String botUsername) {
        this.sessions = sessions;
        this.tg = tg;
        this.botUsername = botUsername == null ? "" : botUsername.trim();
    }

    /** Login boshlash: nonce + bot deep-link qaytaradi. origin — bot "Saytga qaytish" tugmasi uchun. */
    @PostMapping("/telegram/start")
    public Map<String, Object> start(@RequestParam(required = false) String origin) {
        String nonce = sessions.create(origin);
        Map<String, Object> out = new HashMap<>();
        out.put("nonce", nonce);
        out.put("botUsername", botUsername);

        boolean usernameMissing = botUsername.isBlank();
        boolean tokenMissing = !tg.isEnabled();
        out.put("configured", !usernameMissing && !tokenMissing);

        if (usernameMissing) {
            // .env yuklanmagan bo'lsa shu yerga tushadi — jim buzilgan link o'rniga yaqqol belgi.
            log.warn("TELEGRAM_BOT_USERNAME bo'sh — deep-link botsiz bo'lardi. .env yuklanyaptimi? "
                    + "(application.yml spring.config.import / ishchi katalog cwd ni tekshiring).");
            out.put("reason", "TELEGRAM_BOT_USERNAME sozlanmagan");
            out.put("deepLink", null);
            return out;
        }
        if (tokenMissing) {
            // Token yo'q — TelegramBotPoller o'chiq, login hech qachon CONFIRMED bo'lmaydi.
            log.warn("TELEGRAM_BOT_TOKEN bo'sh — bot poller o'chiq, login tasdiqlanmaydi.");
            out.put("reason", "TELEGRAM_BOT_TOKEN sozlanmagan");
        }
        out.put("deepLink", "https://t.me/" + botUsername + "?start=" + nonce);
        return out;
    }

    /** Sayt CONFIRMED bo'lguncha shu yerni so'roqlaydi (poll). */
    @GetMapping("/telegram/poll")
    public Map<String, Object> poll(@RequestParam String nonce) {
        Map<String, Object> out = new HashMap<>();
        LoginSessionStore.Session s = sessions.get(nonce);
        if (s == null) {
            out.put("status", "EXPIRED");
            return out;
        }
        if (s.status == LoginSessionStore.Status.CONFIRMED) {
            out.put("status", "CONFIRMED");
            out.put("token", s.token);
            out.put("user", s.user);
            sessions.remove(nonce); // bir martalik
        } else {
            out.put("status", "PENDING");
        }
        return out;
    }
}
