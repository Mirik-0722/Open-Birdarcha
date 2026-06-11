package uz.mirikdev.open_birdarcha.graph;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import uz.mirikdev.open_birdarcha.dto.EdgeDto;
import uz.mirikdev.open_birdarcha.dto.GraphResponse;
import uz.mirikdev.open_birdarcha.dto.NodeDto;
import uz.mirikdev.open_birdarcha.dto.PathResponse;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.LinkedList;
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

            // Faqat nazorat qirralari: ta'sischi (founder) va rahbar (director).
            // Manzil tugunlari grafga qo'shilmaydi.
            List<EdgeRow> rows = new ArrayList<>();
            rows.addAll(edgeDao.founderEdges(cids, pids));
            rows.addAll(edgeDao.directorEdges(cids, pids));

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

    // ========================================================================
    //  NEPOTIZM TAHLILI — yashirin nazorat aloqalari
    //  Faqat "nazorat" qirralari: FOUNDER (ta'sischi: odam YOKI firma) va
    //  DIRECTOR (rahbar). Manzil qirralari bu yerda hisobga olinmaydi.
    // ========================================================================

    /** Bir qadamlik nazorat qirralari (founder + director) berilgan frontier uchun. */
    private List<EdgeRow> controlEdges(Set<String> frontier) {
        Set<UUID> cids = idsOf(frontier, "company");
        Set<UUID> pids = idsOf(frontier, "person");
        List<EdgeRow> rows = new ArrayList<>();
        rows.addAll(edgeDao.founderEdges(cids, pids));
        rows.addAll(edgeDao.directorEdges(cids, pids));
        return rows;
    }

    /**
     * Ikki obyekt o'rtasidagi eng qisqa nazorat zanjiri (yo'nalishsiz BFS).
     * "Bu firma anavi shaxs/firma bilan qanday bog'langan?" — yashirin aloqani ochadi.
     */
    public PathResponse findPath(String from, String to) {
        validateRef(from);
        validateRef(to);

        if (from.equals(to)) {
            List<NodeDto> n = hydrateNodes(new LinkedHashSet<>(List.of(from)));
            ensureRootExists(n, from);
            return new PathResponse(from, to, true, n, List.of(), 0);
        }

        final int MAX_DEPTH = 8;
        Set<String> visited = new HashSet<>();
        visited.add(from);
        Map<String, String> prevNode = new HashMap<>();
        Map<String, EdgeDto> prevEdge = new HashMap<>();
        Set<String> frontier = new HashSet<>(Set.of(from));
        boolean found = false;

        for (int step = 0; step < MAX_DEPTH && !frontier.isEmpty() && !found; step++) {
            Set<String> next = new LinkedHashSet<>();
            for (EdgeRow r : controlEdges(frontier)) {
                String s = r.source();
                String t = r.target();
                // Faqat hozirgi frontier'dan kengayamiz (BFS qatlam-qatlam = eng qisqa yo'l).
                if (frontier.contains(s) && visited.add(t)) {
                    prevNode.put(t, s);
                    prevEdge.put(t, toDto(r));
                    next.add(t);
                    if (t.equals(to)) { found = true; break; }
                }
                if (frontier.contains(t) && visited.add(s)) {
                    prevNode.put(s, t);
                    prevEdge.put(s, toDto(r));
                    next.add(s);
                    if (s.equals(to)) { found = true; break; }
                }
            }
            frontier = next;
        }

        if (!found) {
            // Tugunlar umuman mavjudmi — bo'lmasa 404, bo'lsa "yo'l yo'q".
            List<NodeDto> chk = hydrateNodes(new LinkedHashSet<>(List.of(from, to)));
            ensureRootExists(chk, from);
            ensureRootExists(chk, to);
            return new PathResponse(from, to, false, List.of(), List.of(), -1);
        }

        LinkedList<String> nodeOrder = new LinkedList<>();
        LinkedList<EdgeDto> edgeOrder = new LinkedList<>();
        for (String cur = to; !cur.equals(from); cur = prevNode.get(cur)) {
            nodeOrder.addFirst(cur);
            edgeOrder.addFirst(prevEdge.get(cur));
        }
        nodeOrder.addFirst(from);

        Map<String, NodeDto> byRef = new HashMap<>();
        for (NodeDto n : hydrateNodes(new LinkedHashSet<>(nodeOrder))) {
            byRef.put(n.id(), n);
        }
        List<NodeDto> ordered = new ArrayList<>();
        for (String ref : nodeOrder) {
            ordered.add(byRef.get(ref));
        }
        return new PathResponse(from, to, true, ordered, new ArrayList<>(edgeOrder), edgeOrder.size());
    }

    /**
     * Tugunning affiliatsiya guruhi: nazorat qirralari bo'yicha bog'langan butun
     * komponent + ichidagi asosiy "nazoratchilar" (kim nechta firmani boshqaradi).
     * meta.controllers — nepotizm bayrog'i: 2+ firmani boshqaradigan shaxs/firma.
     */
    public GraphResponse affiliationGroup(String node) {
        validateRef(node);

        Set<String> nodes = new LinkedHashSet<>();
        nodes.add(node);
        Map<String, EdgeDto> edges = new LinkedHashMap<>();
        Set<String> frontier = new HashSet<>(Set.of(node));
        boolean truncated = false;

        while (!frontier.isEmpty() && !truncated) {
            Set<String> next = new HashSet<>();
            for (EdgeRow r : controlEdges(frontier)) {
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
        ensureRootExists(nodeDtos, node);

        Map<String, String> labelOf = new HashMap<>();
        for (NodeDto n : nodeDtos) {
            labelOf.put(n.id(), n.label());
        }

        // Har bir manba (ta'sischi/rahbar) nechta turli firmani boshqaradi.
        Map<String, Set<String>> controls = new LinkedHashMap<>();
        for (EdgeDto e : edges.values()) {
            if ("FOUNDER".equals(e.type()) || "DIRECTOR".equals(e.type())) {
                controls.computeIfAbsent(e.source(), k -> new LinkedHashSet<>()).add(e.target());
            }
        }
        List<Map<String, Object>> controllers = new ArrayList<>();
        for (Map.Entry<String, Set<String>> en : controls.entrySet()) {
            if (en.getValue().size() < 2) {
                continue; // bitta firma — nazorat to'plami emas
            }
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("ref", en.getKey());
            c.put("label", labelOf.getOrDefault(en.getKey(), en.getKey()));
            c.put("type", en.getKey().startsWith("person:") ? "person" : "company");
            c.put("companies", en.getValue().size());
            controllers.add(c);
        }
        controllers.sort(Comparator.comparingInt((Map<String, Object> c) -> (int) c.get("companies")).reversed());

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("truncated", truncated);
        meta.put("groupSize", nodes.size());
        meta.put("controllers", controllers);
        return new GraphResponse(node, nodeDtos, new ArrayList<>(edges.values()), meta);
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
            // parents = firmaning ta'sischi/rahbarlari (uni nazorat qiladiganlar),
            // children = shu firma ta'sischi bo'lgan boshqa firmalar.
            jdbc.sql("""
                            SELECT c.id, c.name, c.stir, c.status,
                                   (SELECT count(*) FROM (
                                       SELECT person_id::text v FROM founder WHERE company_id = c.id AND person_id IS NOT NULL
                                       UNION SELECT owner_company_id::text FROM founder WHERE company_id = c.id AND owner_company_id IS NOT NULL
                                       UNION SELECT person_id::text FROM director WHERE company_id = c.id
                                   ) t) AS parents,
                                   (SELECT count(DISTINCT company_id) FROM founder WHERE owner_company_id = c.id) AS children
                            FROM company c WHERE c.id IN (:ids)""")
                    .param("ids", cids)
                    .query(rs -> {
                        while (rs.next()) {
                            String id = rs.getString("id");
                            String ref = "company:" + id;
                            Map<String, Object> data = new LinkedHashMap<>();
                            data.put("stir", rs.getString("stir"));
                            data.put("status", rs.getString("status"));
                            data.put("url", "/company/" + id);
                            data.put("parents", rs.getInt("parents"));
                            data.put("children", rs.getInt("children"));
                            byRef.put(ref, new NodeDto(ref, "company", rs.getString("name"), data));
                        }
                        return byRef;
                    });
        }
        if (!pids.isEmpty()) {
            // shaxs uchun parents yo'q; children = u ta'sischi/rahbar bo'lgan firmalar soni.
            jdbc.sql("""
                            SELECT p.id, p.full_name,
                                   (SELECT count(DISTINCT company_id) FROM (
                                       SELECT company_id FROM founder WHERE person_id = p.id
                                       UNION SELECT company_id FROM director WHERE person_id = p.id
                                   ) t) AS children
                            FROM person p WHERE p.id IN (:ids)""")
                    .param("ids", pids)
                    .query(rs -> {
                        while (rs.next()) {
                            String id = rs.getString("id");
                            String ref = "person:" + id;
                            Map<String, Object> data = new LinkedHashMap<>();
                            data.put("url", "/person/" + id);
                            data.put("parents", 0);
                            data.put("children", rs.getInt("children"));
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
