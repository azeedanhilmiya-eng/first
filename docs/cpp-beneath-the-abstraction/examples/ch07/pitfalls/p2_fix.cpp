// p2_fix.cpp -- use the container's own sort, or a container whose iterators qualify.
//
//   g++ -std=c++20 -Wall -Wextra p2_fix.cpp -o p2_fix && ./p2_fix
#include <algorithm>
#include <iostream>
#include <list>
#include <vector>

int main() {
    std::list<int> scores{30, 10, 20};
    scores.sort();                               // a linked list sorts by relinking nodes
    for (int s : scores) std::cout << s << ' ';
    std::cout << '\n';

    std::vector<int> fast{30, 10, 20};
    std::ranges::sort(fast);                     // constrained: a wrong container is a one-line error
    for (int s : fast) std::cout << s << ' ';
    std::cout << '\n';
    return 0;
}
