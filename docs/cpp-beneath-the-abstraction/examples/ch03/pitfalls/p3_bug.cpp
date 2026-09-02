// p3_bug.cpp -- reading a 4-byte integer from a misaligned address.
//
//   g++ -std=c++20 -Wall -Wextra -fsanitize=undefined p3_bug.cpp -o p3_bug && ./p3_bug
#include <cstdint>
#include <iostream>

int main() {
    // A wire packet: 1-byte type, then a 4-byte little-endian length starting at byte 1.
    alignas(4) unsigned char packet[8] = {0x01, 0x10, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0xcc};

    // packet + 1 is an odd address; a uint32_t requires an address divisible by 4.
    const auto* length = reinterpret_cast<const std::uint32_t*>(packet + 1);
    std::cout << "length = " << *length << '\n';
    return 0;
}
