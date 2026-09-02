// p3_fix.cpp -- one direction owns (shared_ptr), the other observes (weak_ptr).
//
//   g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p3_fix.cpp -o p3_fix && ./p3_fix
#include <iostream>
#include <memory>

struct Node {
    std::shared_ptr<Node> next;   // forward: ownership
    std::weak_ptr<Node> prev;     // backward: observation only, no count
    ~Node() { std::cout << "~Node\n"; }
};

int main() {
    auto a = std::make_shared<Node>();
    auto b = std::make_shared<Node>();
    a->next = b;                  // b strong = 2
    b->prev = a;                  // a strong stays 1; a weak = 1
    std::cout << "a strong = " << a.use_count() << ", b strong = " << b.use_count() << '\n';
    return 0;
}   // b (local) dies: b strong 1. a dies: a strong 0 -> ~Node, which releases next -> b strong 0 -> ~Node
