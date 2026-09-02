// p2_bug.cpp -- two translation units, one header, one function defined twice.
//
//   g++ -std=c++20 -Wall -Wextra p2_bug.cpp p2_bug_report.cpp -o p2_bug
//
// Each file compiles on its own without complaint; the LINKER rejects the pair.
#include <iostream>

#include "p2_shapes.h"

int main() {
    const Rect r{2.0, 3.0};
    std::cout << "area = " << area(r) << '\n';
    return 0;
}
