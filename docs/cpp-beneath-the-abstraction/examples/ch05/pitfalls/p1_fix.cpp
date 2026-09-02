// p1_fix.cpp -- a virtual destructor makes `delete base_ptr` dispatch to the real one.
//
//   g++ -std=c++20 -Wall -Wextra p1_fix.cpp -o p1_fix && ./p1_fix
#include <iostream>
#include <memory>
#include <vector>

struct Sensor {
    virtual ~Sensor() = default;             // one vtable slot; deletion now dispatches
    virtual double read() const { return 0.0; }
};

struct BufferedSensor : Sensor {
    std::vector<double> history = std::vector<double>(1024, 1.0);
    double read() const override { return history.back(); }
};

int main() {
    std::unique_ptr<Sensor> s = std::make_unique<BufferedSensor>();   // Chapter 6: no raw delete
    std::cout << "read = " << s->read() << '\n';
    return 0;
}   // ~unique_ptr calls delete on a Sensor*, which now runs ~BufferedSensor first
