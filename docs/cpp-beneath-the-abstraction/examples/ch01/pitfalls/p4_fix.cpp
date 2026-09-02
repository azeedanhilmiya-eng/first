// p4_fix.cpp -- the code is unchanged; the build line and a guard are the fix.
//
//   g++ -std=c++20 -Wall -Wextra p4_fix.cpp -o p4_fix
//
// The static_assert turns a confusing "not a member of std" cascade into one
// line that names the real problem, for whoever builds this file next.
#include <iostream>
#include <span>
#include <vector>

static_assert(__cplusplus >= 202002L, "this file requires -std=c++20 or newer");

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
