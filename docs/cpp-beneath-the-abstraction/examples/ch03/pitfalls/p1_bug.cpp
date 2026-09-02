// p1_bug.cpp -- returning the address of a local variable (a dangling pointer).
//
//   g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug && ./p1_bug
#include <iostream>
#include <string>

// Builds a greeting in a local and hands out its address.
const std::string* make_greeting(const std::string& name) {
    std::string greeting = "hello, " + name;  // lives in THIS call's stack frame
    return &greeting;                         // the frame is released on return
}

int main() {
    const std::string* p = make_greeting("world");
    std::cout << *p << '\n';                  // reads an object that no longer exists
    return 0;
}
