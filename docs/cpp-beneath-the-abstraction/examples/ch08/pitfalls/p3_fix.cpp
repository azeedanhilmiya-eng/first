// p3_fix.cpp -- erase what remove moved to the tail, or use C++20's std::erase.
//
//   g++ -std=c++20 -Wall -Wextra p3_fix.cpp -o p3_fix && ./p3_fix
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 3, 2, 3, 4, 3};
    v.erase(std::remove(v.begin(), v.end(), 3), v.end());   // the erase-remove idiom
    std::cout << "size " << v.size() << ": ";
    for (int x : v) std::cout << x << ' ';
    std::cout << '\n';

    std::vector<int> w{1, 3, 2, 3, 4, 3};
    const auto n = std::erase(w, 3);                        // C++20: one call, returns the count
    std::cout << "erased " << n << ", size " << w.size() << '\n';
    return 0;
}
