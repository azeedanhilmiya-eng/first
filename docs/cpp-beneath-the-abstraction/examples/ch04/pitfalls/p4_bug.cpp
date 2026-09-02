// p4_bug.cpp -- "initializing" const and reference members in the constructor body.
//
//   g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug
#include <iostream>
#include <string>

class Greeting {
public:
    Greeting(const std::string& name, int times) {
        name_ = name;      // too late: name_ had to be bound before the body began
        times_ = times;    // too late: times_ is const and already exists
    }

private:
    const std::string& name_;
    const int times_;
};

int main() {
    const std::string who = "world";
    Greeting g(who, 3);
    return 0;
}
