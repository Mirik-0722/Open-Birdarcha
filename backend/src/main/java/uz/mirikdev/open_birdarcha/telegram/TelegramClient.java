package uz.mirikdev.open_birdarcha.telegram;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Telegram Bot API ustidagi yupqa qatlam (kutubxonasiz, oddiy HTTP).
 * Token bo'sh bo'lsa {@link #isEnabled()} false — ilova baribir ishga tushadi.
 */
@Component
public class TelegramClient {

    private static final String API = "https://api.telegram.org";

    private final RestClient rest;
    private final String token;
    private final boolean enabled;

    public TelegramClient(@Value("${telegram.bot-token:}") String token) {
        this.token = token == null ? "" : token.trim();
        this.enabled = !this.token.isBlank();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(60_000); // long-polling getUpdates uchun
        this.rest = RestClient.builder().requestFactory(factory).build();
    }

    public boolean isEnabled() {
        return enabled;
    }

    private JsonNode call(String method, Map<String, Object> body) {
        return rest.post()
                .uri(API + "/bot" + token + "/" + method)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode getUpdates(long offset, int timeoutSec) {
        return call("getUpdates", Map.of("offset", offset, "timeout", timeoutSec));
    }

    /** Bot token/ulanishini tekshiradi — Telegram getMe javobini qaytaradi (ok + result.username/id). */
    public JsonNode getMe() {
        return call("getMe", Map.of());
    }

    /**
     * Botda webhook o'rnatilgan bo'lsa o'chiradi — webhook va getUpdates (polling) birga ishlay olmaydi
     * (409 Conflict sababi). Polling rejimiga o'tishdan oldin startup'da chaqiriladi.
     */
    public void deleteWebhook() {
        call("deleteWebhook", Map.of());
    }

    public void sendMessage(long chatId, String text, Map<String, Object> replyMarkup) {
        Map<String, Object> body = new HashMap<>();
        body.put("chat_id", chatId);
        body.put("text", text);
        if (replyMarkup != null) {
            body.put("reply_markup", replyMarkup);
        }
        call("sendMessage", body);
    }

    /** Reply-keyboard: bitta "raqamni ulashish" tugmasi. */
    public static Map<String, Object> contactKeyboard(String buttonText) {
        Map<String, Object> button = Map.of("text", buttonText, "request_contact", true);
        return Map.of(
                "keyboard", List.of(List.of(button)),
                "resize_keyboard", true,
                "one_time_keyboard", true);
    }

    public static Map<String, Object> removeKeyboard() {
        return Map.of("remove_keyboard", true);
    }

    /** Inline URL tugmasi (masalan "Saytga qaytish"). Telegram http(s) talab qiladi va localhost'ni rad etadi. */
    public static Map<String, Object> inlineUrlKeyboard(String text, String url) {
        return Map.of("inline_keyboard", List.of(List.of(Map.of("text", text, "url", url))));
    }

    /**
     * Foydalanuvchi avatarini data-URI (base64) ko'rinishida qaytaradi yoki null.
     * Bot token'ni frontendga oshkor qilmaslik uchun rasmni o'zimiz yuklab beramiz.
     */
    public String fetchPhotoDataUri(long userId) {
        try {
            JsonNode photos = call("getUserProfilePhotos", Map.of("user_id", userId, "limit", 1));
            JsonNode arr = photos.path("result").path("photos");
            if (!arr.isArray() || arr.isEmpty()) {
                return null;
            }
            JsonNode sizes = arr.get(0); // eng katta o'lcham — oxirgi element
            String fileId = sizes.get(sizes.size() - 1).path("file_id").asText(null);
            if (fileId == null) {
                return null;
            }
            JsonNode file = call("getFile", Map.of("file_id", fileId));
            String path = file.path("result").path("file_path").asText(null);
            if (path == null) {
                return null;
            }
            byte[] bytes = rest.get()
                    .uri(URI.create(API + "/file/bot" + token + "/" + path))
                    .retrieve()
                    .body(byte[].class);
            if (bytes == null || bytes.length == 0) {
                return null;
            }
            String mime = path.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            return null; // rasm ixtiyoriy — xato bo'lsa shunchaki yo'q
        }
    }
}
