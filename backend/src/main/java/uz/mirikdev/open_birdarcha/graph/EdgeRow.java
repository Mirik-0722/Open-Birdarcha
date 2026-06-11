package uz.mirikdev.open_birdarcha.graph;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EdgeRow(
        String edgeId,
        String type,
        String source,
        String target,
        BigDecimal sharePercent,
        LocalDate dateFrom,
        LocalDate dateTo) {
}
