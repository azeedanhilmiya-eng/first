// p3_bug.cpp -- a lambda that captures a local by reference and outlives it.
//
//   g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug && ./p3_bug
//   g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p3_bug.cpp -o p3_asan
//   ASAN_OPTIONS=detect_stack_use_after_return=1 ./p3_asan
#include <functional>
#include <iostream>

std::function<int()> make_counter(int start) {
    int count = start;                 // a local: lives in THIS frame
    return [&count] { return ++count; };   // the closure stores &count, i.e. an address in a dead frame
}

int main() {
    auto next = make_counter(10);      // make_counter's frame is gone
    std::cout << next() << ' ' << next() << '\n';   // expected 11 12
    return 0;
}
