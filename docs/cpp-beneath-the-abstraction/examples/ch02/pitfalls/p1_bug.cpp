// p1_bug.cpp — testing for signed overflow AFTER it happened (Java habit).
#include <iostream>
#include <limits>

// In Java, int arithmetic wraps, so (x + 1 < x) is a legitimate overflow test.
// In C++, x + 1 is undefined behavior when x == INT_MAX, and the compiler may
// assume undefined behavior never happens -- so x + 1 < x is "always false".
bool next_would_overflow(int x) {
    return x + 1 < x;
}

int next_id(int current) {
    return current + 1;          // undefined behavior when current == INT_MAX
}

int main() {
    int id = std::numeric_limits<int>::max();
    std::cout << std::boolalpha;
    std::cout << "id = " << id << '\n';
    std::cout << "next_would_overflow(id) = " << next_would_overflow(id) << '\n';
    std::cout << "next_id(id) = " << next_id(id) << '\n';
    return 0;
}
