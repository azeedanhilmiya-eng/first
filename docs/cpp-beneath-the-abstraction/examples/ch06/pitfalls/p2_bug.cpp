// p2_bug.cpp -- two shared_ptrs built from the same raw pointer.
//
//   g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug && ./p2_bug
#include <iostream>
#include <memory>

struct Session {
    int id;
    ~Session() { std::cout << "~Session(" << id << ")\n"; }
};

int main() {
    Session* raw = new Session{7};
    std::shared_ptr<Session> a(raw);   // control block #1: strong = 1
    std::shared_ptr<Session> b(raw);   // control block #2: strong = 1, same object
    std::cout << "a.use_count() = " << a.use_count() << ", b.use_count() = " << b.use_count() << '\n';
    return 0;
}   // b's block deletes the Session; then a's block deletes it AGAIN
