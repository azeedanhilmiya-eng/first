// p3_bug.cpp -- includes p3_point.h directly AND indirectly via p3_segment.h.
//
//   g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug
//
// After preprocessing, this translation unit contains `struct Point { ... };`
// TWICE, which the compiler rejects as a redefinition.
#include <iostream>

#include "p3_point.h"
#include "p3_segment.h"

int main() {
    const Segment s{{0.0, 0.0}, {3.0, 4.0}};
    std::cout << "segment from (" << s.from.x << ", " << s.from.y << ") to (" << s.to.x << ", "
              << s.to.y << ")\n";
    return 0;
}
