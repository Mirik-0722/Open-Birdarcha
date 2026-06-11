package uz.mirikdev.open_birdarcha.service;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import uz.mirikdev.open_birdarcha.dto.CompanyCard;
import uz.mirikdev.open_birdarcha.dto.LinkItem;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CompanyService {

    private final JdbcClient jdbc;

    public CompanyService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<CompanyCard> card(UUID id) {
        List<LinkItem> founders = jdbc.sql("""
                        SELECT f.person_id, f.owner_company_id,
                               COALESCE(p.full_name, oc.name) AS label,
                               f.share_percent, f.date_from, f.date_to
                        FROM founder f
                        LEFT JOIN person p ON p.id = f.person_id
                        LEFT JOIN company oc ON oc.id = f.owner_company_id
                        WHERE f.company_id = :id
                        ORDER BY f.date_to NULLS FIRST, f.date_from""")
                .param("id", id)
                .query((rs, n) -> {
                    String personId = rs.getString("person_id");
                    String type = personId != null ? "person" : "company";
                    String refId = personId != null ? personId : rs.getString("owner_company_id");
                    LocalDate to = rs.getObject("date_to", LocalDate.class);
                    return new LinkItem(refId, type, rs.getString("label"),
                            rs.getBigDecimal("share_percent"), null,
                            rs.getObject("date_from", LocalDate.class), to, to == null);
                })
                .list();

        List<LinkItem> directors = jdbc.sql("""
                        SELECT d.person_id, p.full_name AS label, d.position, d.date_from, d.date_to
                        FROM director d
                        JOIN person p ON p.id = d.person_id
                        WHERE d.company_id = :id
                        ORDER BY d.date_to NULLS FIRST, d.date_from""")
                .param("id", id)
                .query((rs, n) -> {
                    LocalDate to = rs.getObject("date_to", LocalDate.class);
                    return new LinkItem(rs.getString("person_id"), "person", rs.getString("label"),
                            null, rs.getString("position"),
                            rs.getObject("date_from", LocalDate.class), to, to == null);
                })
                .list();

        return jdbc.sql("""
                        SELECT c.id, c.stir, c.name, c.status, c.status_date, c.reg_date, c.capital,
                               a.full_text AS address
                        FROM company c
                        LEFT JOIN address a ON a.id = c.address_id
                        WHERE c.id = :id""")
                .param("id", id)
                .query((rs, n) -> new CompanyCard(
                        rs.getString("id"), rs.getString("stir"), rs.getString("name"),
                        rs.getString("status"),
                        rs.getObject("status_date", LocalDate.class),
                        rs.getObject("reg_date", LocalDate.class),
                        rs.getBigDecimal("capital"),
                        rs.getString("address"),
                        founders, directors))
                .optional();
    }
}
