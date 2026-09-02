// p1_bug.cpp -- four threads incrementing one long with no synchronization.
//
//   g++ -std=c++20 -Wall -Wextra -O2 -pthread p1_bug.cpp -o p1_bug && ./p1_bug
//   g++ -std=c++20 -Wall -Wextra -g -fsanitize=thread p1_bug.cpp -o p1_tsan && ./p1_tsan
#include <iostream>
#include <thread>
#include <vector>

int main() {
    long counter = 0;
    {
        std::vector<std::jthread> workers;
        for (int t = 0; t < 4; ++t) {
            workers.emplace_back([&counter] {
                for (int i = 0; i < 100'000; ++i) ++counter;   // load, add, store: three steps, no lock
            });
        }
    }
    std::cout << "counter = " << counter << " (expected 400000)\n";
    return 0;
}
