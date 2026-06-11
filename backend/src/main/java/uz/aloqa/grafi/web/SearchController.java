package uz.aloqa.grafi.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import uz.aloqa.grafi.dto.SearchResponse;
import uz.aloqa.grafi.service.SearchService;

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
