// p4_bug.cpp -- an array owned by a unique_ptr<T> instead of unique_ptr<T[]>.
//
//   g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug && ./p4_bug
//   g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p4_bug.cpp -o p4_asan && ./p4_asan
#include <iostream>
#include <memory>

int main() {
    std::unique_ptr<int> samples(new int[8]{});   // new[] ... but the deleter will call delete
    samples.get()[3] = 42;
    std::cout << "samples[3] = " << samples.get()[3] << '\n';
    return 0;
}   // ~unique_ptr runs `delete p` on memory that came from `new[]`
