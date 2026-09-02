// p4_fix.cpp -- std::scoped_lock takes both mutexes atomically, in a deadlock-free order.
//
//   g++ -std=c++20 -Wall -Wextra -pthread p4_fix.cpp -o p4_fix && ./p4_fix
#include <iostream>
#include <mutex>
#include <thread>

std::mutex accounts_mutex;
std::mutex audit_mutex;

void transfer() {
    std::scoped_lock both(accounts_mutex, audit_mutex);   // argument order does not matter
    std::cout << "transfer done\n";
}

void audit() {
    std::scoped_lock both(audit_mutex, accounts_mutex);   // same two locks, opposite order: still safe
    std::cout << "audit done\n";
}

int main() {
    for (int round = 0; round < 10'000; ++round) {
        std::jthread t1(transfer);
        std::jthread t2(audit);
    }
    std::cout << "all rounds finished\n";
    return 0;
}
