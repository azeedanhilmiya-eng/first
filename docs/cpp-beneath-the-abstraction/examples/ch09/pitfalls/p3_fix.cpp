// p3_fix.cpp -- capture by value (or init-capture) so the closure OWNS its state.
//
//   g++ -std=c++20 -Wall -Wextra p3_fix.cpp -o p3_fix && ./p3_fix
#include <functional>
#include <iostream>

std::function<int()> make_counter(int start) {
    return [count = start]() mutable { return ++count; };   // count lives inside the closure object
}

int main() {
    auto next = make_counter(10);
    std::cout << next() << ' ' << next() << '\n';
    return 0;
}
