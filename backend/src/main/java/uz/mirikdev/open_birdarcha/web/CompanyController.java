package uz.mirikdev.open_birdarcha.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import uz.mirikdev.open_birdarcha.dto.CompanyCard;
import uz.mirikdev.open_birdarcha.service.CompanyService;

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
