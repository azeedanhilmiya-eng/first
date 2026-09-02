// p2_bug.cpp -- std::sort on a std::list: an unconstrained template meets the wrong iterator.
//
//   g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug
#include <algorithm>
#include <iostream>
#include <list>

int main() {
    std::list<int> scores{30, 10, 20};
    std::sort(scores.begin(), scores.end());   // std::sort needs random-access iterators
    for (int s : scores) std::cout << s << ' ';
    std::cout << '\n';
    return 0;
}
