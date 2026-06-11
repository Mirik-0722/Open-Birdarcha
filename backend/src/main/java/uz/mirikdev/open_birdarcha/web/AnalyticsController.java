package uz.mirikdev.open_birdarcha.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import uz.mirikdev.open_birdarcha.dto.GraphResponse;
import uz.mirikdev.open_birdarcha.dto.PathResponse;
import uz.mirikdev.open_birdarcha.graph.GraphService;

/**
 * Nepotizm tahlili endpointlari: yashirin nazorat aloqalari.
 */
@RestController
public class AnalyticsController {

    private final GraphService graphService;

    public AnalyticsController(GraphService graphService) {
        this.graphService = graphService;
    }

    /** Ikki obyekt o'rtasidagi eng qisqa nazorat zanjiri.
     *  Masalan: /api/path?from=person:UUID&to=company:UUID */
    @GetMapping("/api/path")
    public PathResponse path(@RequestParam String from, @RequestParam String to) {
        return graphService.findPath(from, to);
    }

    /** Tugunning affiliatsiya guruhi + asosiy nazoratchilar.
     *  Masalan: /api/affiliations?node=company:UUID */
    @GetMapping("/api/affiliations")
    public GraphResponse affiliations(@RequestParam String node) {
        return graphService.affiliationGroup(node);
    }
}
