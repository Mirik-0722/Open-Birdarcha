package uz.mirikdev.open_birdarcha.dto;

import java.util.Map;

public record EdgeDto(String id, String source, String target, String type, Map<String, Object> data) {
}
