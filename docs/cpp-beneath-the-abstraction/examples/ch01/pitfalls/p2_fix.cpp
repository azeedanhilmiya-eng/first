// p2_fix.cpp -- same program, header function now `inline`.
//
//   g++ -std=c++20 -Wall -Wextra p2_fix.cpp p2_fix_report.cpp -o p2_fix
//
// (p2_fix.cpp also builds alone; p2_fix_report.cpp exists to prove the header
// can be included by more than one translation unit.)
#include <iostream>

#include "p2_shapes_fixed.h"

int main() {
    const Rect r{2.0, 3.0};
    std::cout << "area = " << area(r) << '\n';
    return 0;
}
