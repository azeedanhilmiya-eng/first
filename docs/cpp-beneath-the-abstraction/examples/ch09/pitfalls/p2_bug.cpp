// p2_bug.cpp -- a std::thread that is still joinable when it is destroyed.
//
//   g++ -std=c++20 -Wall -Wextra -pthread p2_bug.cpp -o p2_bug && ./p2_bug
#include <iostream>
#include <thread>

void launch_report() {
    std::thread worker([] { std::cout << "report written\n"; });
    // forgot worker.join(): the std::thread object dies here while the thread may still run
}

int main() {
    launch_report();
    std::cout << "main continues\n";
    return 0;
}
