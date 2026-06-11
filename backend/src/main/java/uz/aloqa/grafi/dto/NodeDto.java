package uz.aloqa.grafi.dto;

import java.util.Map;

public record NodeDto(String id, String type, String label, Map<String, Object> data) {
}
