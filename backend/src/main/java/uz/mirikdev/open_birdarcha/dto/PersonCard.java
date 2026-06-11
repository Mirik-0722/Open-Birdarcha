package uz.mirikdev.open_birdarcha.dto;

import java.util.List;

public record PersonCard(
        String id,
        String fullName,
        List<LinkItem> founderOf,
        List<LinkItem> directorOf) {
}
