// p4_fix.cpp -- either say T explicitly, or give each parameter its own type.
//
//   g++ -std=c++20 -Wall -Wextra p4_fix.cpp -o p4_fix && ./p4_fix
#include <iostream>
#include <type_traits>

template <typename T>
T maximum(T a, T b) {
    return (b < a) ? a : b;
}

template <typename A, typename B>
std::common_type_t<A, B> maximum2(A a, B b) {   // two parameters; the result is their common type
    return (b < a) ? a : b;
}

int main() {
    std::cout << maximum<double>(1, 2.5) << ' '   // T stated: 1 converts to 1.0
              << maximum2(1, 2.5) << '\n';        // A = int, B = double, result double
    return 0;
}
