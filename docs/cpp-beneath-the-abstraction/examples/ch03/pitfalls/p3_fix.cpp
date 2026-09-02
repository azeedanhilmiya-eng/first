// p3_fix.cpp -- copy the bytes into a properly aligned object.
//
//   g++ -std=c++20 -Wall -Wextra -O2 p3_fix.cpp -o p3_fix && ./p3_fix
#include <cstdint>
#include <cstring>
#include <iostream>

int main() {
    alignas(4) unsigned char packet[8] = {0x01, 0x10, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0xcc};

    std::uint32_t length = 0;                         // aligned: it is a real uint32_t object
    std::memcpy(&length, packet + 1, sizeof length);  // at -O2 this becomes ONE unaligned mov
    std::cout << "length = " << length << '\n';
    return 0;
}
