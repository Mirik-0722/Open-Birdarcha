package uz.mirikdev.open_birdarcha.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CompanyCard(
        String id,
        String stir,
        String name,
        String status,
        LocalDate statusDate,
        LocalDate regDate,
        BigDecimal capital,
        String address,
        List<LinkItem> founders,
        List<LinkItem> directors) {
}
