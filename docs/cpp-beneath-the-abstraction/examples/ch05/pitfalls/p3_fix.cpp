// p3_fix.cpp -- do the derived-specific work after the object is complete.
//
//   g++ -std=c++20 -Wall -Wextra p3_fix.cpp -o p3_fix && ./p3_fix
#include <iostream>
#include <memory>
#include <string>

class Widget {
public:
    virtual ~Widget() = default;
    void initialize() { load_resources(); }  // called by whoever CREATES the widget, afterwards

protected:
    virtual void load_resources() = 0;
};

class Button : public Widget {
public:
    explicit Button(std::string caption) : caption_(std::move(caption)) {}
    void load_resources() override { std::cout << "loading caption " << caption_ << '\n'; }

private:
    std::string caption_;
};

// A factory keeps the two-step construction in one place.
template <typename W, typename... Args>
std::unique_ptr<W> make_widget(Args&&... args) {
    auto w = std::make_unique<W>(std::forward<Args>(args)...);   // fully constructed: vptr = W's
    w->initialize();                                            // now the virtual call dispatches to W
    return w;
}

int main() {
    const auto ok = make_widget<Button>("OK");
    return 0;
}
