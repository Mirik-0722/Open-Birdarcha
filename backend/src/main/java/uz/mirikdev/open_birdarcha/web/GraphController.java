package uz.mirikdev.open_birdarcha.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import uz.mirikdev.open_birdarcha.dto.GraphResponse;
import uz.mirikdev.open_birdarcha.graph.GraphService;

@RestController
@RequestMapping("/api/graph")
public class GraphController {

    private final GraphService graphService;

    public GraphController(GraphService graphService) {
        this.graphService = graphService;
    }

    /** Masalan: /api/graph?node=company:cccccccc-0000-0000-0000-000000000001&depth=2 */
    @GetMapping
    public GraphResponse graph(@RequestParam String node,
                               @RequestParam(defaultValue = "2") int depth) {
        return graphService.getGraph(node, depth);
    }

    /** Yig'ilgan manzil tugunini ochish: /api/graph/expand?node=address:UUID */
    @GetMapping("/expand")
    public GraphResponse expand(@RequestParam String node) {
        return graphService.expand(node);
    }
}
