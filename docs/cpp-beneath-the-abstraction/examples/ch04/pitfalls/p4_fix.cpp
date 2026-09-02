// p4_fix.cpp -- the initializer list is the only place a member is constructed.
//
//   g++ -std=c++20 -Wall -Wextra p4_fix.cpp -o p4_fix && ./p4_fix
#include <iostream>
#include <string>

class Greeting {
public:
    Greeting(const std::string& name, int times) : name_(name), times_(times) {}
    void say() const {
        for (int i = 0; i < times_; ++i) std::cout << "hello, " << name_ << '\n';
    }

private:
    const std::string& name_;   // bound once, in the initializer list
    const int times_;           // set once, in the initializer list
};

int main() {
    const std::string who = "world";   // outlives g, so the reference member is safe
    const Greeting g(who, 2);
    g.say();
    return 0;
}
