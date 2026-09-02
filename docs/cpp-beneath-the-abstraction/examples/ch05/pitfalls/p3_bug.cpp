// p3_bug.cpp -- a virtual call from a constructor dispatches to the base, not the derived.
//
//   g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug && ./p3_bug
#include <iostream>
#include <string>

class Widget {
public:
    Widget() { initialize(); }               // hopes to call the derived override
    virtual ~Widget() = default;

protected:
    void initialize() { load_resources(); }  // an ordinary call ...
    virtual void load_resources() = 0;       // ... to a pure virtual, via the vtable
};

class Button : public Widget {
public:
    Button() : Widget(), caption_("OK") {}
    void load_resources() override { std::cout << "loading caption " << caption_ << '\n'; }

private:
    std::string caption_;
};

int main() {
    Button ok;
    return 0;
}
