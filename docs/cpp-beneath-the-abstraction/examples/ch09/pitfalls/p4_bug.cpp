// p4_bug.cpp -- two threads take two mutexes in opposite orders.
//
//   g++ -std=c++20 -Wall -Wextra -pthread p4_bug.cpp -o p4_bug && timeout 5 ./p4_bug
//   g++ -std=c++20 -Wall -Wextra -g -fsanitize=thread p4_bug.cpp -o p4_tsan && timeout 5 ./p4_tsan
#include <iostream>
#include <mutex>
#include <thread>

std::mutex accounts_mutex;
std::mutex audit_mutex;

void transfer() {
    std::lock_guard<std::mutex> a(accounts_mutex);   // holds accounts, then wants audit
    std::this_thread::yield();                       // let the other thread run: makes the bug reliable
    std::lock_guard<std::mutex> b(audit_mutex);
    std::cout << "transfer done\n";
}

void audit() {
    std::lock_guard<std::mutex> b(audit_mutex);      // holds audit, then wants accounts
    std::this_thread::yield();
    std::lock_guard<std::mutex> a(accounts_mutex);
    std::cout << "audit done\n";
}

int main() {
    transfer();                                      // run each once alone: both orders are now "known"
    audit();
    for (int round = 0; round < 10'000; ++round) {   // enough rounds to hit the fatal interleaving
        std::jthread t1(transfer);
        std::jthread t2(audit);
    }
    std::cout << "all rounds finished\n";
    return 0;
}
