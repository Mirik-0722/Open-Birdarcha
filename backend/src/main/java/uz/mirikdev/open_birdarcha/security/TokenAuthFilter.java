package uz.mirikdev.open_birdarcha.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import uz.mirikdev.open_birdarcha.service.AuthService;

import java.io.IOException;

/**
 * /api/** so'rovlarini Bearer token bilan himoyalaydi.
 * /api/auth/** va OPTIONS preflight tekshirilmaydi.
 *
 * <p>Token imzosi lokal (HMAC) tekshiriladi — tashqi so'rov yo'q, shuning uchun kesh kerak emas.
 */
@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    private final AuthService authService;

    public TokenAuthFilter(AuthService authService) {
        this.authService = authService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || !path.startsWith("/api/")
                || path.startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token talab qilinadi");
            return;
        }
        if (!authService.validate(header.substring(7))) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token yaroqsiz yoki muddati o'tgan");
            return;
        }
        chain.doFilter(request, response);
    }
}
