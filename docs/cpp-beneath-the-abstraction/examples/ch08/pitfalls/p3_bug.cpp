// p3_bug.cpp -- std::remove does not remove.
//
//   g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug && ./p3_bug
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 3, 2, 3, 4, 3};
    std::remove(v.begin(), v.end(), 3);   // shifts the survivors forward; the size is unchanged
    std::cout << "size " << v.size() << ": ";
    for (int x : v) std::cout << x << ' ';   // expected: 1 2 4
    std::cout << '\n';
    return 0;
}
