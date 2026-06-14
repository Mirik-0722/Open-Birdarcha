package uz.mirikdev.open_birdarcha.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** HMAC token chiqarish va tekshirish mantiqi (tashqi bog'liqliksiz). */
class AuthServiceTest {

    private static final String SECRET = "test-secret-please-change-32bytes!";

    private AuthService service(long ttlSeconds) {
        return new AuthService(SECRET, ttlSeconds);
    }

    @Test
    void issuedTokenIsValid() {
        AuthService auth = service(86400);
        String token = auth.issueToken(Map.of("id", 42L));

        assertThat(token).contains(".");
        assertThat(auth.validate(token)).isTrue();
    }

    @Test
    void expiredTokenIsRejected() {
        // Salbiy TTL — exp o'tmishda qoladi.
        AuthService auth = service(-10);
        String token = auth.issueToken(Map.of("id", 1L));

        assertThat(auth.validate(token)).isFalse();
    }

    @Test
    void tamperedSignatureIsRejected() {
        AuthService auth = service(86400);
        String token = auth.issueToken(Map.of("id", 7L));

        // Imzoning oxirgi belgisini buzamiz.
        char last = token.charAt(token.length() - 1);
        char swapped = last == 'A' ? 'B' : 'A';
        String tampered = token.substring(0, token.length() - 1) + swapped;

        assertThat(auth.validate(tampered)).isFalse();
    }

    @Test
    void tamperedPayloadIsRejected() {
        AuthService auth = service(86400);
        String token = auth.issueToken(Map.of("id", 7L));

        // Payload qismini buzamiz, imzo o'sha-o'sha — imzo mos kelmaydi.
        int dot = token.indexOf('.');
        String tampered = "x" + token.substring(1, dot) + token.substring(dot);

        assertThat(auth.validate(tampered)).isFalse();
    }

    @Test
    void tokenSignedByDifferentSecretIsRejected() {
        String token = service(86400).issueToken(Map.of("id", 9L));
        AuthService other = new AuthService("totally-different-secret-value!!", 86400);

        assertThat(other.validate(token)).isFalse();
    }

    @Test
    void malformedTokensAreRejected() {
        AuthService auth = service(86400);

        assertThat(auth.validate(null)).isFalse();
        assertThat(auth.validate("")).isFalse();
        assertThat(auth.validate("no-dot")).isFalse();
        assertThat(auth.validate(".onlysig")).isFalse();
        assertThat(auth.validate("onlypayload.")).isFalse();
    }
}
