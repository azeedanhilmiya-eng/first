// p2_bug.cpp — "len(v) - 1" is -1 in Python; v.size() - 1 is 2^64 - 1 in C++.
#include <iostream>
#include <vector>

// Print every adjacent pair (v[i], v[i+1]).
void print_pairs(const std::vector<int>& v) {
    for (int i = 0; i < v.size() - 1; ++i)      // size() is unsigned: 0 - 1 wraps
        std::cout << '(' << v[i] << ',' << v[i + 1] << ") ";
    std::cout << '\n';
}

int main() {
    print_pairs({1, 2, 3});
    print_pairs({});                            // empty: the loop bound is 18446744073709551615
    return 0;
}
