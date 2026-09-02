// p1_bug.cpp -- appending to a vector while iterating over it.
//
//   g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug && ./p1_bug
//   g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p1_bug.cpp -o p1_asan && ./p1_asan
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};
    for (int x : v) {                 // holds an iterator into v's CURRENT buffer
        if (x == 2) v.push_back(20);  // may reallocate: the buffer moves, the iterator dangles
    }
    for (int x : v) std::cout << x << ' ';
    std::cout << '\n';
    return 0;
}
