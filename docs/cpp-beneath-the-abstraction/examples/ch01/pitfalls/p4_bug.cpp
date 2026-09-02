// p4_bug.cpp -- "the tutorial's code does not compile on my machine".
//
// The code is valid C++20. The build line is the bug: g++ 13 defaults to
// -std=gnu++17, so every C++20-only name in the standard library is simply
// absent from the headers, and the compiler reports it as if it never existed.
//
//   g++ -Wall -Wextra p4_bug.cpp -o p4_bug        <-- no -std=c++20
#include <iostream>
#include <span>
#include <vector>

// std::span (C++20): a non-owning view over contiguous elements.
double sum(std::span<const double> values) {
    double total = 0.0;
    for (double v : values) {
        total += v;
    }
    return total;
}

int main() {
    const std::vector<double> sides{3.0, 4.0, 5.0};
    std::cout << "perimeter = " << sum(sides) << '\n';
    return 0;
}
