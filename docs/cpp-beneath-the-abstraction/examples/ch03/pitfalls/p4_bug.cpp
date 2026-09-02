// p4_bug.cpp -- assuming a struct's size is the sum of its members.
//
//   g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug
#include <cstdint>
#include <cstdio>

// A 6-byte header as documented by the wire protocol: version(1) length(4) flags(1).
struct WireHeader {
    std::uint8_t version;
    std::uint32_t length;
    std::uint8_t flags;
};
static_assert(sizeof(WireHeader) == 6, "WireHeader must match the 6-byte wire format");

int main() {
    const WireHeader header{1, 16, 0};
    std::fwrite(&header, sizeof header, 1, stdout);  // would write padding bytes too
    return 0;
}
