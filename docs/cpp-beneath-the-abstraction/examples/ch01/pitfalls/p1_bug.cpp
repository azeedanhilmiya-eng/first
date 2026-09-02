// p1_bug.cpp -- "I declared it, why can't the compiler find it?"
//
// A declaration is a promise: "a function with this exact signature exists
// somewhere in the program". The compiler accepts the promise and emits a call
// to an undefined symbol. The definition lives in geometry.cpp, which was NOT
// passed to g++, so the promise is never kept and the LINKER refuses:
//
//   g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug
#include <iostream>

namespace geo {

struct Point {
    double x;
    double y;
};

// Declaration only. In the real project the definition is in geometry.cpp.
double distance(Point a, Point b) noexcept;

}  // namespace geo

int main() {
    const geo::Point origin{0.0, 0.0};
    const geo::Point corner{3.0, 4.0};
    std::cout << "distance = " << geo::distance(origin, corner) << '\n';
    return 0;
}
