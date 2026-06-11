package uz.mirikdev.open_birdarcha.dto;

import java.util.List;

/**
 * Ikki obyekt o'rtasidagi nazorat zanjiri (eng qisqa yo'l).
 * nodes — yo'l bo'ylab tartiblangan tugunlar (from ... to),
 * edges — ular orasidagi qirralar. length = qadamlar soni (qirralar soni).
 */
public record PathResponse(
        String from,
        String to,
        boolean found,
        List<NodeDto> nodes,
        List<EdgeDto> edges,
        int length) {
}
