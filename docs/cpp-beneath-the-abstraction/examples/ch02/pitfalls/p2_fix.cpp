// p2_fix.cpp — never subtract from an unsigned bound; move the +1 to the other side.
#include <cstddef>
#include <iostream>
#include <vector>

void print_pairs(const std::vector<int>& v) {
    for (std::size_t i = 0; i + 1 < v.size(); ++i)   // i + 1 cannot wrap: i < size()
        std::cout << '(' << v[i] << ',' << v[i + 1] << ") ";
    std::cout << '\n';
}

int main() {
    print_pairs({1, 2, 3});
    print_pairs({});                                 // loop body never runs
    return 0;
}
