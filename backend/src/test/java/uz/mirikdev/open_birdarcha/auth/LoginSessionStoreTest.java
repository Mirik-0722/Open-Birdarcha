package uz.mirikdev.open_birdarcha.auth;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Xotiradagi login sessiyalari oqimi: create → linkChat → confirm → get/remove. */
class LoginSessionStoreTest {

    @Test
    void createReturnsUniquePendingNonce() {
        LoginSessionStore store = new LoginSessionStore();

        String n1 = store.create("https://example.test");
        String n2 = store.create("https://example.test");

        assertThat(n1).isNotBlank().isNotEqualTo(n2);
        assertThat(store.exists(n1)).isTrue();
        assertThat(store.get(n1).status).isEqualTo(LoginSessionStore.Status.PENDING);
        assertThat(store.get(n1).origin).isEqualTo("https://example.test");
    }

    @Test
    void existsHandlesNullAndUnknown() {
        LoginSessionStore store = new LoginSessionStore();

        assertThat(store.exists(null)).isFalse();
        assertThat(store.exists("nope")).isFalse();
        assertThat(store.get(null)).isNull();
    }

    @Test
    void linkChatThenTakeNonceIsOneShot() {
        LoginSessionStore store = new LoginSessionStore();
        String nonce = store.create(null);
        long chatId = 12345L;

        store.linkChat(chatId, nonce);

        assertThat(store.takeNonceForChat(chatId)).isEqualTo(nonce);
        // Ikkinchi marta — bo'sh (bir martalik).
        assertThat(store.takeNonceForChat(chatId)).isNull();
    }

    @Test
    void linkChatIgnoresUnknownNonce() {
        LoginSessionStore store = new LoginSessionStore();

        store.linkChat(999L, "unknown-nonce");

        assertThat(store.takeNonceForChat(999L)).isNull();
    }

    @Test
    void confirmStoresUserAndToken() {
        LoginSessionStore store = new LoginSessionStore();
        String nonce = store.create(null);
        Map<String, Object> user = Map.of("id", 5L, "first_name", "Ali");

        store.confirm(nonce, user, "tok-123");

        LoginSessionStore.Session s = store.get(nonce);
        assertThat(s.status).isEqualTo(LoginSessionStore.Status.CONFIRMED);
        assertThat(s.token).isEqualTo("tok-123");
        assertThat(s.user).isEqualTo(user);
    }

    @Test
    void confirmUnknownNonceIsNoop() {
        LoginSessionStore store = new LoginSessionStore();

        // Istisno tashlamasligi kerak.
        store.confirm("missing", Map.of("id", 1L), "tok");

        assertThat(store.get("missing")).isNull();
    }

    @Test
    void removeDeletesSession() {
        LoginSessionStore store = new LoginSessionStore();
        String nonce = store.create(null);

        store.remove(nonce);

        assertThat(store.exists(nonce)).isFalse();
        assertThat(store.get(nonce)).isNull();
    }
}
