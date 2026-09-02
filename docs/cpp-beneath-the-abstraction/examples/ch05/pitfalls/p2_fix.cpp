// p2_fix.cpp -- pass polymorphic objects by reference (or pointer), never by value.
//
//   g++ -std=c++20 -Wall -Wextra p2_fix.cpp -o p2_fix && ./p2_fix
#include <iostream>
#include <string_view>

struct Animal {
    virtual ~Animal() = default;
    virtual std::string_view sound() const { return "..."; }
};

struct Dog : Animal {
    std::string_view sound() const override { return "woof"; }
};

void speak(const Animal& a) {                // a reference to the caller's object: no copy, no slice
    std::cout << "the animal says " << a.sound() << '\n';
}

int main() {
    Dog rex;
    speak(rex);
    return 0;
}
