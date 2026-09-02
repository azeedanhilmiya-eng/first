// p1_fix.cpp -- return the object by value; the caller owns the result.
//
//   g++ -std=c++20 -Wall -Wextra p1_fix.cpp -o p1_fix && ./p1_fix
#include <iostream>
#include <string>

// Returning by value moves (or elides) the string into the caller's storage.
[[nodiscard]] std::string make_greeting(const std::string& name) {
    std::string greeting = "hello, " + name;
    return greeting;   // named return value: no copy, the object is built in place
}

int main() {
    const std::string greeting = make_greeting("world");  // lives in main's frame
    std::cout << greeting << '\n';
    return 0;
}
