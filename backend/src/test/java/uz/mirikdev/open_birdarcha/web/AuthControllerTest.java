package uz.mirikdev.open_birdarcha.web;

import org.junit.jupiter.api.Test;
import uz.mirikdev.open_birdarcha.auth.LoginSessionStore;
import uz.mirikdev.open_birdarcha.telegram.TelegramClient;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** /api/auth/telegram start va poll endpointlari mantiqi (TelegramClient mock'lanadi). */
class AuthControllerTest {

    private final LoginSessionStore sessions = new LoginSessionStore();

    private AuthController controller(String botUsername, boolean tokenEnabled) {
        TelegramClient tg = mock(TelegramClient.class);
        when(tg.isEnabled()).thenReturn(tokenEnabled);
        return new AuthController(sessions, tg, botUsername);
    }

    @Test
    void startReturnsDeepLinkWhenFullyConfigured() {
        AuthController c = controller("open_birdarcha_bot", true);

        Map<String, Object> out = c.start("https://site.test");

        assertThat(out.get("configured")).isEqualTo(true);
        assertThat(out.get("botUsername")).isEqualTo("open_birdarcha_bot");
        assertThat(out).doesNotContainKey("reason");
        assertThat((String) out.get("deepLink"))
                .startsWith("https://t.me/open_birdarcha_bot?start=")
                .endsWith((String) out.get("nonce"));
    }

    @Test
    void startReportsMissingUsername() {
        AuthController c = controller("", true);

        Map<String, Object> out = c.start(null);

        assertThat(out.get("configured")).isEqualTo(false);
        assertThat(out.get("reason")).isEqualTo("TELEGRAM_BOT_USERNAME sozlanmagan");
        assertThat(out.get("deepLink")).isNull();
    }

    @Test
    void startReportsMissingTokenButStillBuildsDeepLink() {
        AuthController c = controller("open_birdarcha_bot", false);

        Map<String, Object> out = c.start(null);

        assertThat(out.get("configured")).isEqualTo(false);
        assertThat(out.get("reason")).isEqualTo("TELEGRAM_BOT_TOKEN sozlanmagan");
        assertThat((String) out.get("deepLink")).startsWith("https://t.me/open_birdarcha_bot?start=");
    }

    @Test
    void startTrimsBotUsername() {
        AuthController c = controller("  spaced_bot  ", true);

        Map<String, Object> out = c.start(null);

        assertThat(out.get("botUsername")).isEqualTo("spaced_bot");
        assertThat((String) out.get("deepLink")).startsWith("https://t.me/spaced_bot?start=");
    }

    @Test
    void pollUnknownNonceIsExpired() {
        AuthController c = controller("bot", true);

        assertThat(c.poll("does-not-exist").get("status")).isEqualTo("EXPIRED");
    }

    @Test
    void pollPendingThenConfirmed() {
        AuthController c = controller("bot", true);
        String nonce = (String) c.start(null).get("nonce");

        assertThat(c.poll(nonce).get("status")).isEqualTo("PENDING");

        Map<String, Object> user = Map.of("id", 77L, "first_name", "Vali");
        sessions.confirm(nonce, user, "tok-xyz");

        Map<String, Object> confirmed = c.poll(nonce);
        assertThat(confirmed.get("status")).isEqualTo("CONFIRMED");
        assertThat(confirmed.get("token")).isEqualTo("tok-xyz");
        assertThat(confirmed.get("user")).isEqualTo(user);

        // CONFIRMED poll bir martalik — sessiya o'chiriladi.
        assertThat(c.poll(nonce).get("status")).isEqualTo("EXPIRED");
    }
}
