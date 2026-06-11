package uz.aloqa.grafi.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import uz.aloqa.grafi.dto.PersonCard;
import uz.aloqa.grafi.service.PersonService;

import java.util.UUID;

@RestController
public class PersonController {

    private final PersonService personService;

    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    @GetMapping("/api/person/{id}")
    public PersonCard person(@PathVariable UUID id) {
        return personService.card(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shaxs topilmadi"));
    }
}
