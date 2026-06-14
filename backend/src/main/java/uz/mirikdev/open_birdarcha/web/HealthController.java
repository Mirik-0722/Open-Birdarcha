package uz.mirikdev.open_birdarcha.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Yengil health endpoint — Coolify/Docker health check uchun.
 * /api ostida emas, shuning uchun TokenAuthFilter tegmaydi (ochiq, token shart emas).
 */
@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
