package uz.mirikdev.open_birdarcha.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import uz.mirikdev.open_birdarcha.dto.SearchResponse;
import uz.mirikdev.open_birdarcha.service.SearchService;

@RestController
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/api/search")
    public SearchResponse search(@RequestParam(defaultValue = "") String q) {
        return new SearchResponse(searchService.search(q));
    }
}
