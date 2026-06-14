package uz.mirikdev.open_birdarcha.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * O'zimizning sessiya token'imiz: HMAC-SHA256 bilan imzolangan, holatsiz (stateless).
 * Format:  base64url(payloadJson).base64url(hmac(payloadJson))
 *
 * <p>validate() to'liq lokal — tashqi so'rovsiz. Token'ni faqat shu server imzolagani uchun
 * uni ishonchli deb hisoblaymiz (TokenAuthFilter shu metoddan foydalanadi).
 */
@Service
public class AuthService {

    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();

    private final byte[] secret;
    private final long ttlSeconds;
    private final ObjectMapper mapper = new ObjectMapper();

    public AuthService(
            @Value("${auth.token-secret}") String secret,
            @Value("${auth.token-ttl-seconds:86400}") long ttlSeconds) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttlSeconds = ttlSeconds;
    }

    /** Foydalanuvchi uchun imzolangan token chiqaradi. */
    public String issueToken(Map<String, Object> user) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("sub", user.get("id"));
        payload.put("exp", Instant.now().getEpochSecond() + ttlSeconds);
        try {
            String json = mapper.writeValueAsString(payload);
            String p = B64.encodeToString(json.getBytes(StandardCharsets.UTF_8));
            return p + "." + B64.encodeToString(hmac(p));
        } catch (Exception e) {
            throw new IllegalStateException("Token yaratib bo'lmadi", e);
        }
    }

    /** Token imzosi va muddatini lokal tekshiradi. */
    public boolean validate(String token) {
        try {
            if (token == null) {
                return false;
            }
            int dot = token.indexOf('.');
            if (dot <= 0 || dot == token.length() - 1) {
                return false;
            }
            String p = token.substring(0, dot);
            String sig = token.substring(dot + 1);
            String expected = B64.encodeToString(hmac(p));
            if (!MessageDigest.isEqual(sig.getBytes(StandardCharsets.UTF_8),
                    expected.getBytes(StandardCharsets.UTF_8))) {
                return false;
            }
            JsonNode payload = mapper.readTree(B64D.decode(p));
            return payload.path("exp").asLong(0) > Instant.now().getEpochSecond();
        } catch (Exception e) {
            return false;
        }
    }

    private byte[] hmac(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }
}
