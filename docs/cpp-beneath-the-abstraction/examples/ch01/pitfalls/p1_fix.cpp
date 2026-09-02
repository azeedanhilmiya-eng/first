// p1_fix.cpp -- every function that is declared AND used needs exactly one
// definition somewhere in the set of object files handed to the linker.
//
// In a multi-file project the fix is the build line, not the code:
//   g++ -std=c++20 -Wall -Wextra main.cpp geometry.cpp -o main
// This single-file version keeps the definition next to the declaration so it
// builds on its own:
//   g++ -std=c++20 -Wall -Wextra p1_fix.cpp -o p1_fix
#include <cmath>
#include <iostream>

namespace geo {

struct Point {
    double x;
    double y;
};

double distance(Point a, Point b) noexcept;  // the promise ...

double distance(Point a, Point b) noexcept {  // ... and the promise kept.
    const double dx = b.x - a.x;              // The signature must match the
    const double dy = b.y - a.y;              // declaration token for token, or
    return std::sqrt(dx * dx + dy * dy);      // the linker sees a different symbol.
}

}  // namespace geo

int main() {
    const geo::Point origin{0.0, 0.0};
    const geo::Point corner{3.0, 4.0};
    std::cout << "distance = " << geo::distance(origin, corner) << '\n';
    return 0;
}
