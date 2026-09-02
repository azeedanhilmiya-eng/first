// p4_fix.cpp -- `override` makes the compiler check that a function really overrides.
//
//   g++ -std=c++20 -Wall -Wextra p4_fix.cpp -o p4_fix && ./p4_fix
#include <iostream>

struct Shape {
    virtual ~Shape() = default;
    virtual double area() const { return 0.0; }
};

struct Square : Shape {
    explicit Square(double side) : side_(side) {}
    double area() const override { return side_ * side_; }   // signature verified against the base
    double side_;
};

int main() {
    const Square sq(3.0);
    const Shape& s = sq;
    std::cout << "area via Shape& = " << s.area() << '\n';
    return 0;
}
