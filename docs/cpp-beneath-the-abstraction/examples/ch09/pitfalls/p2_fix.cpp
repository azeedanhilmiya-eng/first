// p2_fix.cpp -- std::jthread joins in its destructor; the scope becomes the lifetime.
//
//   g++ -std=c++20 -Wall -Wextra -pthread p2_fix.cpp -o p2_fix && ./p2_fix
#include <iostream>
#include <thread>

void launch_report() {
    std::jthread worker([] { std::cout << "report written\n"; });
}   // ~jthread: request_stop(), then join(): the function does not return until the thread is done

int main() {
    launch_report();
    std::cout << "main continues\n";
    return 0;
}
