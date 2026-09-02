// p3_bug.cpp -- a reference cycle of shared_ptrs: nothing ever reaches zero.
//
//   g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p3_bug.cpp -o p3_bug && ./p3_bug
#include <iostream>
#include <memory>

struct Node {
    std::shared_ptr<Node> next;   // owns the other node ...
    ~Node() { std::cout << "~Node\n"; }
};

int main() {
    auto a = std::make_shared<Node>();
    auto b = std::make_shared<Node>();
    a->next = b;                  // a owns b   (b strong = 2)
    b->next = a;                  // b owns a   (a strong = 2) ... and owns itself through a
    std::cout << "a strong = " << a.use_count() << ", b strong = " << b.use_count() << '\n';
    return 0;
}   // a and b (the locals) die: both counts drop to 1, never to 0. No ~Node is printed.
