package uz.aloqa.grafi.graph;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Graf qirralarini (chiziqlarni) bazadan o'qiydi.
 * Har bir founder/director satri = bitta qirra.
 */
@Repository
public class EdgeDao {

    private final JdbcClient jdbc;

    public EdgeDao(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Ta'sischilik qirralari: person/company -> company. */
    public List<EdgeRow> founderEdges(Set<UUID> companyIds, Set<UUID> personIds) {
        List<String> conds = new ArrayList<>();
        Map<String, Object> params = new HashMap<>();
        if (!companyIds.isEmpty()) {
            conds.add("f.company_id IN (:cids) OR f.owner_company_id IN (:cids)");
            params.put("cids", companyIds);
        }
        if (!personIds.isEmpty()) {
            conds.add("f.person_id IN (:pids)");
            params.put("pids", personIds);
        }
        if (conds.isEmpty()) {
            return List.of();
        }
        String sql = """
                SELECT f.id,
                       COALESCE('person:' || f.person_id::text,
                                'company:' || f.owner_company_id::text) AS source,
                       'company:' || f.company_id::text AS target,
                       f.share_percent, f.date_from, f.date_to
                FROM founder f
                WHERE (""" + String.join(") OR (", conds) + ")";
        return jdbc.sql(sql).params(params).query(this::founderRow).list();
    }

    private EdgeRow founderRow(ResultSet rs, int rowNum) throws SQLException {
        return new EdgeRow(
                "f-" + rs.getString("id"),
                "FOUNDER",
                rs.getString("source"),
                rs.getString("target"),
                rs.getBigDecimal("share_percent"),
                rs.getObject("date_from", LocalDate.class),
                rs.getObject("date_to", LocalDate.class));
    }

    /** Rahbarlik qirralari: person -> company. */
    public List<EdgeRow> directorEdges(Set<UUID> companyIds, Set<UUID> personIds) {
        List<String> conds = new ArrayList<>();
        Map<String, Object> params = new HashMap<>();
        if (!companyIds.isEmpty()) {
            conds.add("d.company_id IN (:cids)");
            params.put("cids", companyIds);
        }
        if (!personIds.isEmpty()) {
            conds.add("d.person_id IN (:pids)");
            params.put("pids", personIds);
        }
        if (conds.isEmpty()) {
            return List.of();
        }
        String sql = """
                SELECT d.id,
                       'person:' || d.person_id::text AS source,
                       'company:' || d.company_id::text AS target,
                       d.date_from, d.date_to
                FROM director d
                WHERE (""" + String.join(") OR (", conds) + ")";
        return jdbc.sql(sql).params(params).query((rs, n) -> new EdgeRow(
                "d-" + rs.getString("id"),
                "DIRECTOR",
                rs.getString("source"),
                rs.getString("target"),
                null,
                rs.getObject("date_from", LocalDate.class),
                rs.getObject("date_to", LocalDate.class))).list();
    }

    /** Kompaniya -> hozirgi manzil qirralari. */
    public List<EdgeRow> registeredAtEdges(Set<UUID> companyIds) {
        if (companyIds.isEmpty()) {
            return List.of();
        }
        String sql = """
                SELECT c.id, c.address_id
                FROM company c
                WHERE c.id IN (:cids) AND c.address_id IS NOT NULL""";
        return jdbc.sql(sql).param("cids", companyIds).query(this::addressRow).list();
    }

    /** Manzil -> shu manzildagi kompaniyalar qirralari (har manzil uchun limit bilan). */
    public List<EdgeRow> companiesAtAddressEdges(Set<UUID> addressIds, int limitPerAddress) {
        if (addressIds.isEmpty()) {
            return List.of();
        }
        String sql = """
                SELECT id, address_id FROM (
                    SELECT c.id, c.address_id,
                           row_number() OVER (PARTITION BY c.address_id ORDER BY c.name) AS rn
                    FROM company c
                    WHERE c.address_id IN (:aids)
                ) t
                WHERE rn <= :lim""";
        return jdbc.sql(sql)
                .param("aids", addressIds)
                .param("lim", limitPerAddress)
                .query(this::addressRow).list();
    }

    private EdgeRow addressRow(ResultSet rs, int rowNum) throws SQLException {
        String companyId = rs.getString("id");
        return new EdgeRow(
                "ca-" + companyId,
                "REGISTERED_AT",
                "company:" + companyId,
                "address:" + rs.getString("address_id"),
                null, null, null);
    }

    /** Har bir manzilda nechta kompaniya borligi ("11" badge uchun). */
    public Map<UUID, Integer> addressCompanyCounts(Set<UUID> addressIds) {
        if (addressIds.isEmpty()) {
            return Map.of();
        }
        return jdbc.sql("""
                        SELECT address_id, count(*) AS cnt
                        FROM company
                        WHERE address_id IN (:aids)
                        GROUP BY address_id""")
                .param("aids", addressIds)
                .query(rs -> {
                    Map<UUID, Integer> out = new HashMap<>();
                    while (rs.next()) {
                        out.put(rs.getObject("address_id", UUID.class), rs.getInt("cnt"));
                    }
                    return out;
                });
    }
}
