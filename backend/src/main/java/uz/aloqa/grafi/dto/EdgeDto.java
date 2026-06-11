package uz.aloqa.grafi.dto;

import java.util.Map;

public record EdgeDto(String id, String source, String target, String type, Map<String, Object> data) {
}
