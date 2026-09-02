// p1_fix.cpp -- the definition is visible at the point of use.
//
//   g++ -std=c++20 -Wall -Wextra p1_fix.cpp -o p1_fix && ./p1_fix
#include <iostream>

#include "p1_fix.h"

int main() {
    std::cout << maximum(3, 7) << '\n';   // maximum<int> is instantiated in THIS translation unit
    return 0;
}
