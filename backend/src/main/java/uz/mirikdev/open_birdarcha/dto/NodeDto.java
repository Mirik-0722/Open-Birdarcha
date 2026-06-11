package uz.mirikdev.open_birdarcha.dto;

import java.util.Map;

public record NodeDto(String id, String type, String label, Map<String, Object> data) {
}
