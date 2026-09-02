// p2_bug.cpp -- passing a polymorphic object BY VALUE slices it.
//
//   g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug && ./p2_bug
#include <iostream>
#include <string_view>

struct Animal {
    virtual ~Animal() = default;
    virtual std::string_view sound() const { return "..."; }
};

struct Dog : Animal {
    std::string_view sound() const override { return "woof"; }
};

void speak(Animal a) {                       // by value: the parameter IS an Animal, nothing more
    std::cout << "the animal says " << a.sound() << '\n';
}

int main() {
    Dog rex;
    speak(rex);                              // copies the Animal part of rex into `a`
    return 0;
}
