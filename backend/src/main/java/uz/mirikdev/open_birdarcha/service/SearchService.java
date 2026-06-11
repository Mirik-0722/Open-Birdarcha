package uz.mirikdev.open_birdarcha.service;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import uz.mirikdev.open_birdarcha.dto.SearchItem;

import java.util.ArrayList;
import java.util.List;

@Service
public class SearchService {

    private final JdbcClient jdbc;

    public SearchService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Kompaniya (nom yoki STIR) va shaxs (ism yoki PINFL) bo'yicha qidiruv. */
    public List<SearchItem> search(String q) {
        String query = q == null ? "" : q.trim();
        if (query.isEmpty()) {
            return List.of();
        }
        String like = "%" + query + "%";

        List<SearchItem> out = new ArrayList<>();
        out.addAll(jdbc.sql("""
                        SELECT id, name, stir, status
                        FROM company
                        WHERE stir = :q OR name ILIKE :like
                        ORDER BY name
                        LIMIT 10""")
                .param("q", query)
                .param("like", like)
                .query((rs, n) -> new SearchItem(
                        rs.getString("id"), "company", rs.getString("name"),
                        rs.getString("stir"), rs.getString("status")))
                .list());
        out.addAll(jdbc.sql("""
                        SELECT id, full_name
                        FROM person
                        WHERE pinfl = :q OR full_name ILIKE :like
                        ORDER BY full_name
                        LIMIT 10""")
                .param("q", query)
                .param("like", like)
                .query((rs, n) -> new SearchItem(
                        rs.getString("id"), "person", rs.getString("full_name"),
                        null, null))
                .list());
        return out;
    }
}
