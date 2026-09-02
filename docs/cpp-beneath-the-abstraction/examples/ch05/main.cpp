// main.cpp -- Chapter 5: what a virtual call is, where the vtable pointer lives,
// and what goes wrong when an object is copied into its base class.
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <iomanip>
#include <iostream>
#include <memory>
#include <string_view>
#include <typeinfo>
#include <vector>

#include "shapes.h"

namespace {

void heading(std::string_view text) { std::cout << "\n== " << text << " ==\n"; }

[[nodiscard]] std::uintptr_t addr(const void* p) noexcept { return reinterpret_cast<std::uintptr_t>(p); }

// The first 8 bytes of a polymorphic object on the Itanium ABI are the vptr.
// Reading them this way is NOT portable C++; it is a probe to show what g++ does.
[[nodiscard]] std::uintptr_t vptr_of(const geo::Shape& s) {
    std::uintptr_t v = 0;
    std::memcpy(&v, static_cast<const void*>(&s), sizeof v);
    return v;
}

// ---- 1. layout ------------------------------------------------------------
struct Plain { std::string label; };   // same data as Shape, no virtual functions

void show_layout() {
    heading("1. Layout: one hidden pointer per polymorphic object");
    std::cout << "  sizeof(Plain)  = " << sizeof(Plain) << "   (just the std::string)\n";
    std::cout << "  sizeof(Shape)  = " << sizeof(geo::Shape) << "   (vptr 8 + std::string 32)\n";
    std::cout << "  sizeof(Circle) = " << sizeof(geo::Circle) << "   (Shape 40 + double 8)\n";
    std::cout << "  sizeof(Rect)   = " << sizeof(geo::Rect) << "   (Shape 40 + two doubles)\n";

    const geo::Circle c("c1", 1.0);
    std::cout << "  offset of label_ inside Circle: " << addr(&c.label()) - addr(&c)
              << " (the 8 bytes before it are the vptr)\n";
}

// ---- 2. vptr and vtable -----------------------------------------------------
void show_vptr() {
    heading("2. vptr: set by the constructor, shared by every object of one dynamic type");
    const geo::Circle c1("c1", 1.0), c2("c2", 2.0);
    const geo::Rect r1("r1", 1.0, 2.0);
    std::cout << std::boolalpha;
    std::cout << "  vptr(c1) == vptr(c2): " << (vptr_of(c1) == vptr_of(c2)) << "  (one vtable per class)\n";
    std::cout << "  vptr(c1) == vptr(r1): " << (vptr_of(c1) == vptr_of(r1)) << "  (different classes)\n";
    std::cout << "  vptr(c1) != 0:        " << (vptr_of(c1) != 0) << "  (points into .rodata of the executable)\n";
}

// ---- 3. dispatch ------------------------------------------------------------
void report(const geo::Shape& s) {          // static type: Shape. Dynamic type: whatever was passed.
    std::cout << "  " << std::left << std::setw(14) << s.describe()   // describe() is non-virtual ...
              << " area = " << std::fixed << std::setprecision(3) << s.area() << '\n';  // ... area() is virtual
}

void show_dispatch() {
    heading("3. Dynamic dispatch: the call site does not know which function it calls");
    std::vector<std::unique_ptr<geo::Shape>> shapes;   // pointers: the objects keep their real type
    shapes.push_back(std::make_unique<geo::Circle>("wheel", 0.5));
    shapes.push_back(std::make_unique<geo::Rect>("door", 0.8, 2.0));
    shapes.push_back(std::make_unique<geo::Rect>("tile", 0.3, 0.3));
    for (const auto& s : shapes) report(*s);
}

// ---- 4. dynamic_cast and typeid -------------------------------------------
void inspect(const geo::Shape& s) {
    std::cout << "  " << s.label() << ": typeid name \"" << typeid(s).name() << "\"";
    if (const auto* r = dynamic_cast<const geo::Rect*>(&s)) {   // run-time check via RTTI
        std::cout << ", is a Rect, square = " << r->is_square();
    } else {
        std::cout << ", dynamic_cast<const Rect*> returned nullptr";
    }
    std::cout << '\n';
}

void show_rtti() {
    heading("4. dynamic_cast and typeid consult the vtable's type information");
    const geo::Circle c("c", 1.0);
    const geo::Rect r("r", 2.0, 2.0);
    inspect(c);
    inspect(r);
    std::cout << "  typeid(c) == typeid(geo::Circle): " << (typeid(c) == typeid(geo::Circle)) << '\n';
    try {
        [[maybe_unused]] const auto& as_rect = dynamic_cast<const geo::Rect&>(c);   // reference form throws
    } catch (const std::bad_cast& e) {
        std::cout << "  dynamic_cast<const Rect&>(circle) threw: " << e.what() << '\n';
    }
}

// ---- 5. slicing -------------------------------------------------------------
struct Base {
    virtual ~Base() = default;
    [[nodiscard]] virtual std::string_view who() const { return "Base"; }
    int shared = 1;
};
struct Derived : Base {
    [[nodiscard]] std::string_view who() const override { return "Derived"; }
    int extra = 2;   // fits in Base's tail padding: sizeof(Derived) == sizeof(Base)
};

void show_slicing() {
    heading("5. Object slicing: copying into a base object cuts the derived part off");
    const Derived d;
    const Base& ref = d;         // a reference: still the same Derived object
    const Base copy = d;         // a COPY into a Base: vptr rewritten, `extra` left behind
    std::cout << "  sizeof(Base) = " << sizeof(Base) << ", sizeof(Derived) = " << sizeof(Derived) << '\n';
    std::cout << "  ref.who()  = " << ref.who() << "   (dynamic type preserved)\n";
    std::cout << "  copy.who() = " << copy.who() << "      (sliced: a Base is all that exists)\n";
    std::vector<Base> by_value;
    by_value.push_back(d);       // every element is a Base; the Derived part never gets in
    std::cout << "  by_value[0].who() = " << by_value[0].who() << '\n';
}

// ---- 6. multiple inheritance: this-pointer adjustment -----------------------
struct Logger { virtual ~Logger() = default; virtual void log() const {} int log_level = 3; };
struct Timer  { virtual ~Timer() = default; virtual void tick() const {} int ticks = 0; };
struct Service : Logger, Timer {};

void show_this_adjustment() {
    heading("6. Multiple inheritance: a Timer* into a Service does not point at its start");
    Service svc;
    Logger* as_logger = &svc;    // first base: same address
    Timer* as_timer = &svc;      // second base: the compiler ADDS an offset
    std::cout << "  sizeof(Service) = " << sizeof(Service) << " (two vptr+int subobjects of 16)\n";
    std::cout << "  (Logger*)&svc - &svc = " << addr(as_logger) - addr(&svc) << " bytes\n";
    std::cout << "  (Timer*)&svc  - &svc = " << addr(as_timer) - addr(&svc) << " bytes\n";
    Service* back = dynamic_cast<Service*>(as_timer);   // subtracts the offset again
    std::cout << "  dynamic_cast back to Service* restores the address: " << (back == &svc) << '\n';
}

}  // namespace

int main() {
    std::cout << "Chapter 5 probe: g++ 13, x86-64 Linux, Itanium C++ ABI";
    show_layout();
    show_vptr();
    show_dispatch();
    show_rtti();
    show_slicing();
    show_this_adjustment();
    return 0;
}
