package uz.aloqa.grafi.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import uz.aloqa.grafi.dto.CompanyCard;
import uz.aloqa.grafi.service.CompanyService;

import java.util.UUID;

@RestController
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping("/api/company/{id}")
    public CompanyCard company(@PathVariable UUID id) {
        return companyService.card(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kompaniya topilmadi"));
    }
}
