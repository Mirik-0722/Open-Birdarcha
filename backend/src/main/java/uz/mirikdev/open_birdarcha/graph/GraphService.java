package uz.mirikdev.open_birdarcha.graph;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import uz.mirikdev.open_birdarcha.dto.EdgeDto;
import uz.mirikdev.open_birdarcha.dto.GraphResponse;
import uz.mirikdev.open_birdarcha.dto.NodeDto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Graf JSON'ini yig'adigan asosiy servis.
 * Mantiq: berilgan tugundan boshlab depth qadam BFS, har qadamda
 * frontier'dagi tugunlarning barcha qirralari olinadi.
 */
@Service
public class GraphService {

    public static final int MAX_NODES = 200;          // graf portlashidan himoya
    public static final int MAX_ADDRESS_NEIGHBORS = 5; // bundan ko'p firma bo'lsa manzil "yig'iladi"

    private static final Pattern REF =
            Pattern.compile("(company|person|address):[0-9a-fA-F-]{36}");

    private final EdgeDao edgeDao;
    private final JdbcClient jdbc;

    public GraphService(EdgeDao edgeDao, JdbcClient jdbc) {
        this.edgeDao = edgeDao;
        this.jdbc = jdbc;
    }

    public GraphResponse getGraph(String root, int depth) {
        validateRef(root);
        depth = Math.max(1, Math.min(depth, 3));

        Set<String> nodes = new LinkedHashSet<>();
        nodes.add(root);
        Map<String, EdgeDto> edges = new LinkedHashMap<>();
        Map<String, Integer> collapsed = new LinkedHashMap<>();
        boolean truncated = false;

        Set<String> frontier = Set.of(root);
        for (int step = 0; step < depth && !frontier.isEmpty() && !truncated; step++) {
            Set<UUID> cids = idsOf(frontier, "company");
            Set<UUID> pids = idsOf(frontier, "person");
            Set<UUID> aids = idsOf(frontier, "address");

            List<EdgeRow> rows = new ArrayList<>();
            rows.addAll(edgeDao.founderEdges(cids, pids));
            rows.addAll(edgeDao.directorEdges(cids, pids));
            rows.addAll(edgeDao.registeredAtEdges(cids));

            if (!aids.isEmpty()) {
                Map<UUID, Integer> counts = edgeDao.addressCompanyCounts(aids);
                Set<UUID> expandable = new HashSet<>();
                for (UUID aid : aids) {
                    int cnt = counts.getOrDefault(aid, 0);
                    if (cnt > MAX_ADDRESS_NEIGHBORS) {
                        collapsed.put("address:" + aid, cnt); // "11" badge holati
                    } else if (cnt > 0) {
                        expandable.add(aid);
                    }
                }
                rows.addAll(edgeDao.companiesAtAddressEdges(expandable, MAX_ADDRESS_NEIGHBORS));
            }

            Set<String> next = new HashSet<>();
            for (EdgeRow r : rows) {
                edges.putIfAbsent(r.edgeId(), toDto(r));
                for (String n : List.of(r.source(), r.target())) {
                    if (nodes.add(n)) {
                        next.add(n);
                    }
                }
                if (nodes.size() >= MAX_NODES) {
                    truncated = true;
                    break;
                }
            }
            frontier = next;
        }

        List<NodeDto> nodeDtos = hydrateNodes(nodes);
        ensureRootExists(nodeDtos, root);

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("depth", depth);
        meta.put("truncated", truncated);
        meta.put("collapsed", collapsed);
        return new GraphResponse(root, nodeDtos, new ArrayList<>(edges.values()), meta);
    }

    /**
     * Tugunni "ochish". Manzil bo'lsa — shu manzildagi kompaniyalar (100 tagacha),
     * boshqa tugun bo'lsa — oddiy depth=1 graf.
     */
    public GraphResponse expand(String ref) {
        validateRef(ref);
        if (!ref.startsWith("address:")) {
            return getGraph(ref, 1);
        }
        UUID aid = UUID.fromString(ref.substring("address:".length()));
        List<EdgeRow> rows = edgeDao.companiesAtAddressEdges(Set.of(aid), 100);

        Set<String> nodes = new LinkedHashSet<>();
        nodes.add(ref);
        Map<String, EdgeDto> edges = new LinkedHashMap<>();
        for (EdgeRow r : rows) {
            edges.putIfAbsent(r.edgeId(), toDto(r));
            nodes.add(r.source());
            nodes.add(r.target());
        }

        List<NodeDto> nodeDtos = hydrateNodes(nodes);
        ensureRootExists(nodeDtos, ref);

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("depth", 1);
        meta.put("truncated", false);
        meta.put("collapsed", Map.of());
        return new GraphResponse(ref, nodeDtos, new ArrayList<>(edges.values()), meta);
    }

    // ---------- ichki yordamchilar ----------

    private void validateRef(String ref) {
        if (ref == null || !REF.matcher(ref).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "node parametri 'company:UUID', 'person:UUID' yoki 'address:UUID' ko'rinishida bo'lishi kerak");
        }
    }

    private void ensureRootExists(List<NodeDto> nodeDtos, String root) {
        boolean found = false;
        for (NodeDto n : nodeDtos) {
            if (n.id().equals(root)) {
                found = true;
                break;
            }
        }
        if (!found) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tugun topilmadi: " + root);
        }
    }

    private static Set<UUID> idsOf(Set<String> refs, String type) {
        Set<UUID> out = new HashSet<>();
        String prefix = type + ":";
        for (String r : refs) {
            if (r.startsWith(prefix)) {
                out.add(UUID.fromString(r.substring(prefix.length())));
            }
        }
        return out;
    }

    private static EdgeDto toDto(EdgeRow r) {
        Map<String, Object> data = new LinkedHashMap<>();
        if (r.sharePercent() != null) {
            data.put("share_percent", r.sharePercent());
        }
        if (r.dateFrom() != null) {
            data.put("date_from", r.dateFrom().toString());
        }
        if (r.dateTo() != null) {
            data.put("date_to", r.dateTo().toString());
        }
        data.put("is_current", r.dateTo() == null);
        return new EdgeDto(r.edgeId(), r.source(), r.target(), r.type(), data);
    }

    /** Tugun id'laridan to'liq NodeDto yasash: nom, holat, manzildagi firma soni. */
    private List<NodeDto> hydrateNodes(Set<String> refs) {
        Set<UUID> cids = idsOf(refs, "company");
        Set<UUID> pids = idsOf(refs, "person");
        Set<UUID> aids = idsOf(refs, "address");
        Map<String, NodeDto> byRef = new HashMap<>();

        if (!cids.isEmpty()) {
            jdbc.sql("SELECT id, name, stir, status FROM company WHERE id IN (:ids)")
                    .param("ids", cids)
                    .query(rs -> {
                        while (rs.next()) {
                            String id = rs.getString("id");
                            String ref = "company:" + id;
                            Map<String, Object> data = new LinkedHashMap<>();
                            data.put("stir", rs.getString("stir"));
                            data.put("status", rs.getString("status"));
                            data.put("url", "/company/" + id);
                            byRef.put(ref, new NodeDto(ref, "company", rs.getString("name"), data));
                        }
                        return byRef;
                    });
        }
        if (!pids.isEmpty()) {
            jdbc.sql("SELECT id, full_name FROM person WHERE id IN (:ids)")
                    .param("ids", pids)
                    .query(rs -> {
                        while (rs.next()) {
                            String id = rs.getString("id");
                            String ref = "person:" + id;
                            Map<String, Object> data = new LinkedHashMap<>();
                            data.put("url", "/person/" + id);
                            byRef.put(ref, new NodeDto(ref, "person", rs.getString("full_name"), data));
                        }
                        return byRef;
                    });
        }
        if (!aids.isEmpty()) {
            jdbc.sql("""
                            SELECT a.id, a.full_text,
                                   (SELECT count(*) FROM company c WHERE c.address_id = a.id) AS cnt
                            FROM address a
                            WHERE a.id IN (:ids)""")
                    .param("ids", aids)
                    .query(rs -> {
                        while (rs.next()) {
                            String id = rs.getString("id");
                            String ref = "address:" + id;
                            Map<String, Object> data = new LinkedHashMap<>();
                            data.put("company_count", rs.getInt("cnt"));
                            byRef.put(ref, new NodeDto(ref, "address", rs.getString("full_text"), data));
                        }
                        return byRef;
                    });
        }

        List<NodeDto> out = new ArrayList<>();
        for (String ref : refs) {
            NodeDto n = byRef.get(ref);
            if (n != null) {
                out.add(n);
            }
        }
        return out;
    }
}
