// p4_fix.cpp -- say it is an array: unique_ptr<int[]> deletes with delete[] and indexes with [].
//
//   g++ -std=c++20 -Wall -Wextra p4_fix.cpp -o p4_fix && ./p4_fix
#include <iostream>
#include <memory>
#include <vector>

int main() {
    std::unique_ptr<int[]> samples = std::make_unique<int[]>(8);   // value-initialized, delete[] on destruction
    samples[3] = 42;
    std::cout << "samples[3] = " << samples[3] << '\n';

    std::vector<int> better(8);   // usually the right answer: it also knows its size
    better[3] = 42;
    std::cout << "better[3] = " << better[3] << ", size " << better.size() << '\n';
    return 0;
}
