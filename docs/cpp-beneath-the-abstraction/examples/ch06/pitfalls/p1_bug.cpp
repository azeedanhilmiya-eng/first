// p1_bug.cpp -- copying a unique_ptr.
//
//   g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug
#include <iostream>
#include <memory>
#include <vector>

struct Connection {
    int id;
};

void register_connection(std::unique_ptr<Connection> c, std::vector<std::unique_ptr<Connection>>& pool) {
    pool.push_back(std::move(c));
}

int main() {
    std::vector<std::unique_ptr<Connection>> pool;
    std::unique_ptr<Connection> conn = std::make_unique<Connection>(1);
    register_connection(conn, pool);   // tries to COPY the unique_ptr: two owners of one object
    std::cout << "still have conn " << conn->id << '\n';
    return 0;
}
