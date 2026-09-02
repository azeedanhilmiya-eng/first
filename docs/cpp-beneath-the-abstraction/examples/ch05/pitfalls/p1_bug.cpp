// p1_bug.cpp -- deleting through a base pointer whose destructor is not virtual.
//
//   g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug && ./p1_bug
//   g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p1_bug.cpp -o p1_asan && ./p1_asan
#include <iostream>
#include <vector>

struct Sensor {
    virtual double read() const { return 0.0; }
    // No virtual destructor: ~Sensor() is an ordinary, statically bound function.
};

struct BufferedSensor : Sensor {
    std::vector<double> history = std::vector<double>(1024, 1.0);   // 8 KiB on the heap
    double read() const override { return history.back(); }
};

int main() {
    Sensor* s = new BufferedSensor;          // dynamic type: BufferedSensor
    std::cout << "read = " << s->read() << '\n';
    delete s;                                // static type: Sensor -> only ~Sensor() runs
    return 0;
}
