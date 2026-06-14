package uz.mirikdev.open_birdarcha.telegram;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import uz.mirikdev.open_birdarcha.auth.LoginSessionStore;
import uz.mirikdev.open_birdarcha.service.AuthService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Startup'dagi Telegram ulanish tekshiruvi (getMe). */
class TelegramBotPollerTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static JsonNode json(String s) {
        try {
            return MAPPER.readTree(s);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private TelegramBotPoller poller(TelegramClient tg) {
        return new TelegramBotPoller(tg, new LoginSessionStore(), mock(AuthService.class));
    }

    @Test
    void verifyConnectionTrueWhenGetMeOk() {
        TelegramClient tg = mock(TelegramClient.class);
        when(tg.getMe()).thenReturn(json("{\"ok\":true,\"result\":{\"id\":42,\"username\":\"ob_bot\"}}"));

        assertThat(poller(tg).verifyConnection()).isTrue();
    }

    @Test
    void verifyConnectionFalseWhenGetMeNotOk() {
        TelegramClient tg = mock(TelegramClient.class);
        when(tg.getMe()).thenReturn(json("{\"ok\":false,\"description\":\"Unauthorized\"}"));

        assertThat(poller(tg).verifyConnection()).isFalse();
    }

    @Test
    void verifyConnectionFalseWhenGetMeThrows() {
        TelegramClient tg = mock(TelegramClient.class);
        when(tg.getMe()).thenThrow(new RuntimeException("connection refused"));

        assertThat(poller(tg).verifyConnection()).isFalse();
    }

    @Test
    void verifyConnectionFalseWhenGetMeNull() {
        TelegramClient tg = mock(TelegramClient.class);
        when(tg.getMe()).thenReturn(null);

        assertThat(poller(tg).verifyConnection()).isFalse();
    }
}
