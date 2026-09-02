// p2_fix.cpp -- one control block: create with make_shared, share by copying the shared_ptr.
//
//   g++ -std=c++20 -Wall -Wextra p2_fix.cpp -o p2_fix && ./p2_fix
#include <iostream>
#include <memory>

struct Session {
    int id;
    ~Session() { std::cout << "~Session(" << id << ")\n"; }
};

int main() {
    std::shared_ptr<Session> a = std::make_shared<Session>(7);   // the raw pointer never escapes
    std::shared_ptr<Session> b = a;                              // copy: same block, strong = 2
    std::cout << "a.use_count() = " << a.use_count() << ", b.use_count() = " << b.use_count() << '\n';
    return 0;
}   // strong 2 -> 1 -> 0: exactly one delete
