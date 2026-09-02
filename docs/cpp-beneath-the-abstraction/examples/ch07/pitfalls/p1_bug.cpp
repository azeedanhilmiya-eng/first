// p1_bug.cpp -- a template declared in a header and DEFINED in a separate .cpp file.
//
//   g++ -std=c++20 -Wall -Wextra p1_bug.cpp p1_bug_impl.cpp -o p1_bug
#include <iostream>

#include "p1_bug.h"

int main() {
    std::cout << maximum(3, 7) << '\n';   // needs maximum<int>: the compiler cannot build it here
    return 0;
}
