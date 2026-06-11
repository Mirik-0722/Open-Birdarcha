package uz.mirikdev.open_birdarcha.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LinkItem(
        String id,
        String type,
        String label,
        BigDecimal sharePercent,
        String position,
        LocalDate dateFrom,
        LocalDate dateTo,
        boolean current) {
}
