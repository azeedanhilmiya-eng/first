// p4_bug.cpp -- one template parameter, two different argument types.
//
//   g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug
#include <iostream>

template <typename T>
T maximum(T a, T b) {
    return (b < a) ? a : b;
}

int main() {
    std::cout << maximum(1, 2.5) << '\n';   // T = int from `1`, T = double from `2.5`: which?
    return 0;
}
