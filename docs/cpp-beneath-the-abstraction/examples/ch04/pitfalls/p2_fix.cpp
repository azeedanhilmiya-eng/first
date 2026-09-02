// p2_fix.cpp -- declare members in dependency order, and initialize from parameters.
//
//   g++ -std=c++20 -Wall -Wextra p2_fix.cpp -o p2_fix && ./p2_fix
#include <iostream>

class Range {
public:
    // Both initializers depend only on the parameter, and the list order matches
    // the declaration order, so -Wreorder has nothing to say.
    explicit Range(int lo) : lo_(lo), hi_(lo + 10) {}
    [[nodiscard]] int lo() const noexcept { return lo_; }
    [[nodiscard]] int hi() const noexcept { return hi_; }

private:
    int lo_;   // declared first: constructed first
    int hi_;
};

int main() {
    const Range r(5);
    std::cout << "lo = " << r.lo() << ", hi = " << r.hi() << '\n';
    return 0;
}
