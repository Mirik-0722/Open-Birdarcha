package uz.aloqa.grafi.dto;

import java.util.List;
import java.util.Map;

public record GraphResponse(String root, List<NodeDto> nodes, List<EdgeDto> edges, Map<String, Object> meta) {
}
