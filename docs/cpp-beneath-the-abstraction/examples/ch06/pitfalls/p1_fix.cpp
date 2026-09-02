// p1_fix.cpp -- ownership is transferred explicitly with std::move; borrowing uses a reference.
//
//   g++ -std=c++20 -Wall -Wextra p1_fix.cpp -o p1_fix && ./p1_fix
#include <iostream>
#include <memory>
#include <vector>

struct Connection {
    int id;
};

void register_connection(std::unique_ptr<Connection> c, std::vector<std::unique_ptr<Connection>>& pool) {
    pool.push_back(std::move(c));
}

void ping(const Connection& c) { std::cout << "ping " << c.id << '\n'; }   // borrow, no ownership

int main() {
    std::vector<std::unique_ptr<Connection>> pool;
    std::unique_ptr<Connection> conn = std::make_unique<Connection>(1);
    ping(*conn);                                   // use it while we own it
    register_connection(std::move(conn), pool);   // hand it over: conn is now null
    std::cout << "conn after move is " << (conn ? "non-null" : "null") << ", pool owns "
              << pool.size() << " connection\n";
    ping(*pool.front());
    return 0;
}
