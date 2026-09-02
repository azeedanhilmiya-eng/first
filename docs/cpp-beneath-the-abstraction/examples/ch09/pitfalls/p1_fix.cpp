// p1_fix.cpp -- make the increment atomic (one instruction), or guard it with a mutex.
//
//   g++ -std=c++20 -Wall -Wextra -O2 -pthread p1_fix.cpp -o p1_fix && ./p1_fix
#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

int main() {
    std::atomic<long> counter{0};
    {
        std::vector<std::jthread> workers;
        for (int t = 0; t < 4; ++t) {
            workers.emplace_back([&counter] {
                for (int i = 0; i < 100'000; ++i) counter.fetch_add(1, std::memory_order_relaxed);   // `lock add`
            });
        }
    }
    std::cout << "counter = " << counter.load() << " (expected 400000)\n";
    return 0;
}
