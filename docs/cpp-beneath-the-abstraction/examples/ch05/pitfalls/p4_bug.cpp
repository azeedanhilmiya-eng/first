// p4_bug.cpp -- a signature mismatch HIDES the base function instead of overriding it.
//
//   g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug && ./p4_bug
#include <iostream>

struct Shape {
    virtual ~Shape() = default;
    virtual double area() const { return 0.0; }
};

struct Square : Shape {
    explicit Square(double side) : side_(side) {}
    double area() { return side_ * side_; }   // missing `const`: a NEW, non-virtual function
    double side_;
};

int main() {
    const Square sq(3.0);
    const Shape& s = sq;
    std::cout << "area via Shape& = " << s.area() << '\n';   // expected 9
    return 0;
}
