// p3_fix.cpp -- both headers are now safe to include any number of times.
//
//   g++ -std=c++20 -Wall -Wextra p3_fix.cpp -o p3_fix
#include <iostream>

#include "p3_point_fixed.h"
#include "p3_segment_fixed.h"
#include "p3_point_fixed.h"  // deliberately again: harmless now

int main() {
    const Segment s{{0.0, 0.0}, {3.0, 4.0}};
    std::cout << "segment from (" << s.from.x << ", " << s.from.y << ") to (" << s.to.x << ", "
              << s.to.y << ")\n";
    return 0;
}
