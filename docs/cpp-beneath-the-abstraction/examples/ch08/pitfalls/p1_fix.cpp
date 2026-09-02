// p1_fix.cpp -- iterate over a fixed range, or collect first and append afterwards.
//
//   g++ -std=c++20 -Wall -Wextra p1_fix.cpp -o p1_fix && ./p1_fix
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};
    const std::size_t original = v.size();      // indices stay valid across reallocation
    for (std::size_t i = 0; i < original; ++i) {
        if (v[i] == 2) v.push_back(20);         // v[i] is re-evaluated from the (possibly new) buffer
    }
    for (int x : v) std::cout << x << ' ';
    std::cout << '\n';

    std::vector<int> w{1, 2, 3};
    std::vector<int> extra;
    for (int x : w) if (x == 2) extra.push_back(20);   // no mutation of w while iterating it
    w.insert(w.end(), extra.begin(), extra.end());
    for (int x : w) std::cout << x << ' ';
    std::cout << '\n';
    return 0;
}
