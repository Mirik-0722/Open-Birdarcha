package uz.mirikdev.open_birdarcha.service;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import uz.mirikdev.open_birdarcha.dto.LinkItem;
import uz.mirikdev.open_birdarcha.dto.PersonCard;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PersonService {

    private final JdbcClient jdbc;

    public PersonService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<PersonCard> card(UUID id) {
        List<LinkItem> founderOf = jdbc.sql("""
                        SELECT c.id, c.name, f.share_percent, f.date_from, f.date_to
                        FROM founder f
                        JOIN company c ON c.id = f.company_id
                        WHERE f.person_id = :id
                        ORDER BY f.date_to NULLS FIRST, f.date_from""")
                .param("id", id)
                .query((rs, n) -> {
                    LocalDate to = rs.getObject("date_to", LocalDate.class);
                    return new LinkItem(rs.getString("id"), "company", rs.getString("name"),
                            rs.getBigDecimal("share_percent"), null,
                            rs.getObject("date_from", LocalDate.class), to, to == null);
                })
                .list();

        List<LinkItem> directorOf = jdbc.sql("""
                        SELECT c.id, c.name, d.position, d.date_from, d.date_to
                        FROM director d
                        JOIN company c ON c.id = d.company_id
                        WHERE d.person_id = :id
                        ORDER BY d.date_to NULLS FIRST, d.date_from""")
                .param("id", id)
                .query((rs, n) -> {
                    LocalDate to = rs.getObject("date_to", LocalDate.class);
                    return new LinkItem(rs.getString("id"), "company", rs.getString("name"),
                            null, rs.getString("position"),
                            rs.getObject("date_from", LocalDate.class), to, to == null);
                })
                .list();

        return jdbc.sql("SELECT id, full_name FROM person WHERE id = :id")
                .param("id", id)
                .query((rs, n) -> new PersonCard(
                        rs.getString("id"), rs.getString("full_name"), founderOf, directorOf))
                .optional();
    }
}
