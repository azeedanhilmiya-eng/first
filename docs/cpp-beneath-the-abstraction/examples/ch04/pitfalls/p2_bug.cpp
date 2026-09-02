// p2_bug.cpp -- initializer-list order is NOT the initialization order.
//
//   g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug && ./p2_bug
#include <iostream>

class Range {
public:
    // The list says lo_ then hi_, but members are constructed in DECLARATION order:
    // hi_ is declared first, so hi_(lo_ + 10) runs while lo_ is still uninitialized.
    explicit Range(int lo) : lo_(lo), hi_(lo_ + 10) {}
    [[nodiscard]] int lo() const noexcept { return lo_; }
    [[nodiscard]] int hi() const noexcept { return hi_; }

private:
    int hi_;
    int lo_;
};

int main() {
    const Range r(5);
    std::cout << "lo = " << r.lo() << ", hi = " << r.hi() << '\n';   // expected 5 and 15
    return 0;
}
