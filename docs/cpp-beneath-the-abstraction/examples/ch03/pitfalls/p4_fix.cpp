// p4_fix.cpp -- serialize field by field; never fwrite/memcpy a struct as bytes.
//
//   g++ -std=c++20 -Wall -Wextra p4_fix.cpp -o p4_fix && ./p4_fix | xxd
#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstring>

struct WireHeader {
    std::uint8_t version;
    std::uint32_t length;
    std::uint8_t flags;
};

// The wire format is a byte layout, so build it explicitly: 6 bytes, no padding,
// little-endian length regardless of the CPU.
[[nodiscard]] std::array<std::byte, 6> encode(const WireHeader& h) noexcept {
    std::array<std::byte, 6> out{};
    out[0] = static_cast<std::byte>(h.version);
    for (int i = 0; i < 4; ++i)
        out[1 + i] = static_cast<std::byte>((h.length >> (8 * i)) & 0xFFu);
    out[5] = static_cast<std::byte>(h.flags);
    return out;
}

int main() {
    const WireHeader header{1, 16, 0};
    const auto bytes = encode(header);
    std::fwrite(bytes.data(), bytes.size(), 1, stdout);
    return 0;
}
