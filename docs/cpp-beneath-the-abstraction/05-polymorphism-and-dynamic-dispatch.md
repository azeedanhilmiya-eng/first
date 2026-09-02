# Chapter 5: Polymorphism and Dynamic Dispatch

> Series: C++: From Beginner to Advanced: Beneath the Abstraction
> Standard: C++20 (`-std=c++20`) · Toolchain used for every output below: g++ 13.3 on x86-64 Linux

## 1. Motivation and Mental Model

### Core Problem
A call made through a base-class pointer or reference must reach the derived class's implementation without the call site knowing which derived classes exist, and C++ achieves that with one hidden pointer per object and one table per class, at a cost you can count in instructions.

### Analogy / Python-Java Contrast
Think of a universal remote control. Every device you point it at carries a small card taped to its back (the **Virtual Table Pointer (vptr) (虚函数表指针)**) that says "my brand's button map is on page 12". The remote does not know what device it is holding; when you press *power* it reads the card, opens page 12 of its manual (the **Virtual Table (vtable) (虚函数表)**), finds the *power* row, and sends whatever code is written there. Two televisions of the same model share the same page; a different model has a different page. Only the buttons listed in the manual work this way; a button that is not in the manual is wired directly and does the same thing for every device.

In Java every object starts with a header that includes a pointer to its class, and every non-`static`, non-`final`, non-`private` method is virtual: `shape.area()` is always a lookup, and the JIT works hard to guess the target so that it can inline the call. Python goes further: `shape.area()` is a *string* lookup of `"area"` through the instance's `__dict__` and then the class's method resolution order, on every call, which is why it is flexible and why it is slow.

C++ makes you say which functions are looked up, with the keyword `virtual`. Those, and only those, get a row in the table; everything else is bound at compile time to a fixed address, exactly like a call to a free function. An object of a class with no virtual functions has no card at all, which is why a `struct Point { double x, y; }` is 16 bytes and not 24. This chapter is about the card, the page, the lookup, and the three things that go wrong when you forget an object is more than its base-class part.

## 2. Deep Dive and Low-Level Mechanics

### 2.1 Inheritance is layout: the base comes first

**Inheritance (继承)** in C++ is, before anything else, a statement about bytes. A **Derived Class (派生类)** object contains a complete **Base Class (基类)** object as its first member, called the *base subobject*, followed by the members the derived class adds. A pointer to the derived object *is* a pointer to the base subobject: converting `Circle*` to `Shape*` changes the type and, for a single base, not the address.

```text
Diagram 1 — the example's geo::Circle in memory (Itanium C++ ABI, x86-64, libstdc++ 13): sizeof == 48

  offset  0 ┌──────────────────────────────┐ ◀── Circle* and Shape* both point here
            │ vptr                 8 bytes │ ──▶ vtable for geo::Circle, entry 0 (see Diagram 2)
          8 ├──────────────────────────────┤     ┐
            │ label_   std::string  32     │     │ geo::Shape subobject: bytes 0..39
         40 ├──────────────────────────────┤     ┘
            │ radius_  double       8      │     Circle's own member
         48 └──────────────────────────────┘

  sizeof(Plain{std::string}) == 32     no virtual functions: no vptr, no header of any kind
  sizeof(Shape)              == 40     the vptr appears the moment the class has ONE virtual function
  sizeof(Circle)             == 48     Shape + radius_
  sizeof(Rect)               == 56     Shape + w_ + h_
```

The example measures all four sizes and the offset of `label_` (8: the vptr sits in front of it). Adding the first `virtual` keyword to a class costs every object eight bytes; adding the tenth costs nothing more, because the pointer is to a *table*.

### 2.2 The vtable: one per class, built by the compiler

For every class with a virtual function the compiler emits a constant table in read-only data. g++ will print it for you with `-fdump-lang-class`:

```text
$ g++ -std=c++20 -fdump-lang-class -c shapes.cpp && cat shapes.cpp.001l.class   (excerpt)
Vtable for geo::Shape
geo::Shape::_ZTVN3geo5ShapeE: 6 entries
0     (int (*)(...))0                         offset-to-top (used by multiple inheritance)
8     (int (*)(...))(& _ZTIN3geo5ShapeE)      pointer to typeinfo for geo::Shape (RTTI)
16    0                                       ~Shape (complete)      \  a "= default" destructor of an
24    0                                       ~Shape (deleting)      /  abstract class: never emitted
32    (int (*)(...))__cxa_pure_virtual        area()  : pure virtual -> the "pure virtual method called" trap
40    (int (*)(...))__cxa_pure_virtual        kind()  : pure virtual

Vtable for geo::Circle
geo::Circle::_ZTVN3geo6CircleE: 6 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTIN3geo6CircleE)
16    (int (*)(...))geo::Circle::~Circle      complete-object destructor
24    (int (*)(...))geo::Circle::~Circle      deleting destructor (runs ~Circle, then operator delete)
32    (int (*)(...))geo::Circle::area         SAME SLOT as Shape::area: that is what "override" means
40    (int (*)(...))geo::Circle::kind

Class geo::Circle
   size=48 align=8
    vptr=((& geo::Circle::_ZTVN3geo6CircleE) + 16)   <- the vptr points PAST the two header entries
```

```text
Diagram 2 — two Circles and a Rect at run time: objects point at tables, tables point at code

   Circle c1 (48 bytes)        .data.rel.ro of the executable                  .text
  ┌──────────────┐            vtable for geo::Circle (_ZTVN3geo6CircleE)
  │ vptr ────────┼──┐   -16 ┌────────────────────────────┐
  │ label_ "c1"  │  │       │ offset-to-top = 0          │
  │ radius_ 1.0  │  │    -8 │ &typeinfo for geo::Circle  │ ─────▶  used by typeid / dynamic_cast
  └──────────────┘  ├────▶0 │ &Circle::~Circle (complete)│ ─────▶  geo::Circle::~Circle()
   Circle c2        │    +8 │ &Circle::~Circle (deleting)│ ─────▶  ~Circle, then operator delete
  ┌──────────────┐  │   +16 │ &Circle::area              │ ─────▶  geo::Circle::area() const
  │ vptr ────────┼──┘   +24 │ &Circle::kind              │ ─────▶  geo::Circle::kind() const
  │ label_ "c2"  │          └────────────────────────────┘
  │ radius_ 2.0  │          vtable for geo::Rect (_ZTVN3geo4RectE)
  └──────────────┘          ┌────────────────────────────┐
   Rect r1                  │ ... header ...             │
  ┌──────────────┐     ────▶│ &Rect::~Rect, &Rect::~Rect │
  │ vptr ────────┼──────────│ &Rect::area                │ ─────▶  geo::Rect::area() const
  │ label_, w_,h_│     +16  │ &Rect::kind                │
  └──────────────┘          └────────────────────────────┘
   vptr(c1) == vptr(c2)  (one table per class)      vptr(c1) != vptr(r1)      (Rect has its own)
```

The table is ordinary read-only data. `nm -C shapes.o` lists `vtable for geo::Circle` and `typeinfo for geo::Circle` as data symbols in the object file that defines `Circle::area`, the class's first non-inline virtual function (the ABI's *key function* rule decides which translation unit emits the table). The slot order is fixed by the *base* class: `area` is entry 2 in `Shape`'s table, so it is entry 2 in every derived class's table, and that is the entire mechanism of overriding: **the derived class fills the same slot with a different address.**

### 2.3 What a virtual call compiles to

Now the example's `report(const geo::Shape& s)` calls `s.area()`. The compiler does not know whether `s` is a `Circle` or a `Rect`; it knows only that `area` is slot 2. Here is the call at `-O0`:

```text
$ objdump -d -C --no-show-raw-insn main | grep -A5 'report(geo::Shape const&)>:'   (excerpt around the call)
    mov    -0x48(%rbp),%rax      ; rax = &s                (the object's address)
    mov    (%rax),%rax           ; rax = s.vptr            (load 1: the card)
    add    $0x10,%rax            ; rax = &vtable[2]        (slot 2 = area: 2 × 8 bytes)
    mov    (%rax),%rdx           ; rdx = vtable[2]         (load 2: the function's address)
    mov    -0x48(%rbp),%rax
    mov    %rax,%rdi             ; this = &s
    call   *%rdx                 ; indirect call: the target is a register, not a constant
```

That is **Dynamic Dispatch (动态分发)**: two dependent memory loads and an indirect `call`, a few nanoseconds, and the target is unknown until the instant of the call, so the compiler cannot inline it. Compare the non-virtual `s.describe()` on the previous line of `report`: it compiles to `call geo::Shape::describe() const`, a fixed address decided at link time, **Static Dispatch (静态分发)**, exactly like Chapter 1's calls. Inside `describe()`, `kind()` *is* virtual, so a non-virtual function can still reach the derived class through the table.

The rule that decides which mechanism applies is worth stating precisely. Every expression has a **Static Type (静态类型)**, known to the compiler (`const Shape&`), and every polymorphic object has a **Dynamic Type (动态类型)**, the class it was constructed as (`Circle`). Non-virtual calls use the static type; virtual calls through a pointer or reference use the dynamic type; and virtual calls on an object *by value* (`Shape s; s.area()`) use the static type too, because the object *is* its static type.

### 2.4 Who writes the vptr, and when

Nothing in the object is "polymorphic" until the vptr is stored, and it is stored by the constructor. Constructing a `Circle` runs the `Shape` constructor first, which stores *Shape's* vtable address, and then the `Circle` constructor body's prologue overwrites it with *Circle's*. Destruction runs the film backwards: `~Circle` runs with Circle's vptr, then resets the vptr to Shape's before `~Shape` runs.

```text
Diagram 3 — the vptr during the lifetime of  geo::Circle c("c1", 1.0)

  time ──────────────────────────────────────────────────────────────────────────────────────▶
  ┌───────────────┬────────────────────┬─────────────────────┬─────────────────────┬────────────────┐
  │ raw storage   │ Shape::Shape runs  │ Circle::Circle runs │ object is complete  │ ~Circle, ~Shape│
  │ vptr = ???    │ vptr = &vtable<Shape>+16 │ vptr = &vtable<Circle>+16 │ vptr = Circle's │ vptr: Circle's,│
  │               │ virtual calls here │ virtual calls here  │ virtual calls reach │ then Shape's   │
  │               │ reach SHAPE's slots│ reach CIRCLE's slots│ Circle's overrides  │ again          │
  └───────────────┴────────────────────┴─────────────────────┴─────────────────────┴────────────────┘
                   ▲ a virtual call from Shape's constructor cannot see Circle: Circle's members do not exist yet
```

This is not a quirk; it is a safety rule. During `Shape::Shape`, `Circle::radius_` has not been initialized, so a call landing in `Circle::area()` would read garbage. The language guarantees it lands in `Shape::area()` instead, and if that is pure virtual, the slot holds `__cxa_pure_virtual`, which prints `pure virtual method called` and aborts (Pitfall 3).

The "two destructors" in the table follow from the same timeline. Entry 0 (the *complete-object* destructor) destroys the object in place; entry 1 (the *deleting* destructor) does that and then calls `operator delete` with the *derived* class's size. `delete shape_ptr` calls entry 1 through the vtable, which is the whole point of a **Virtual Destructor (虚析构函数)**: without it, `delete` on a `Shape*` binds statically to `Shape::~Shape`, the derived members are never destroyed, and `operator delete` is told the wrong size (Pitfall 1 shows ASan catching precisely that).

Two related keywords complete the picture. A **Pure Virtual Function (纯虚函数)** (`= 0`) has no body of its own and makes the class an **Abstract Class (抽象类)**, which cannot be instantiated: the compiler refuses to create an object whose table has holes. `final` on a class (the example's `Circle`) or a function forbids further overriding, which lets the compiler turn some virtual calls back into direct ones.

### 2.5 RTTI: the typeinfo slot, `dynamic_cast`, and `typeid`

Entry `-8` of every vtable points at a `typeinfo` object describing the class: its mangled name, and, for derived classes, pointers to the base classes' `typeinfo`. This is **RTTI (Run-Time Type Information) (运行时类型信息)**, and two operators read it:

- `typeid(expr)` on a polymorphic reference follows the vptr to the typeinfo and returns it. `typeid(s).name()` is the *mangled* name (`N3geo6CircleE`; `c++filt` decodes it), and `typeid(c) == typeid(geo::Circle)` compares the two typeinfo objects.
- `dynamic_cast<const Rect*>(&s)` follows the vptr to the typeinfo and walks the inheritance graph at run time, comparing against `Rect`'s typeinfo. It returns `nullptr` when the object is not a `Rect`; the reference form throws `std::bad_cast` because a reference cannot be null. The walk costs string comparisons of mangled names in the general case, far more than a virtual call, which is why a `dynamic_cast` in a hot loop is a design smell: the usual fix is one more virtual function.

`static_cast<const Rect*>(&s)` does the same conversion with *no* check: it is free and, when `s` is really a `Circle`, undefined behavior.

### 2.6 Object slicing: copying a derived object into a base

The card lives *inside* the object, so anything that copies only the base subobject leaves the card behind. `const Base copy = d;` copy-constructs a `Base` from the `Base` part of `d`: the vptr of `copy` is written by `Base`'s copy constructor to point at *Base's* table, and `Derived::extra` is never copied because `copy` has no room for it. This is **Object Slicing (对象切片)**.

```text
Diagram 4 — Derived d; Base copy = d;   (the example's section 5; sizeof(Base) == sizeof(Derived) == 16)

       d : Derived                              copy : Base
  offset ┌──────────────────┐                   ┌──────────────────┐
     0   │ vptr → Derived's │ ── Base(const Base&) copies the Base part ──▶ │ vptr → BASE's    │  rewritten
     8   │ shared = 1       │ ─────────────────────────────────────────────▶ │ shared = 1       │
    12   │ extra  = 2       │  (lives in Base's tail padding: not copied)    └──────────────────┘
         └──────────────────┘
   ref.who()  == "Derived"    a Base& to d still sees d's vptr
   copy.who() == "Base"       copy has never been anything but a Base
```

Slicing happens in three disguises: initializing a base object from a derived one, passing a polymorphic object *by value* to a function whose parameter is the base (Pitfall 2), and storing derived objects in a `std::vector<Base>`. None of them warns. Java and Python cannot slice because their variables are references; the C++ equivalent of a Java `Shape` variable is `Shape&`, `Shape*`, or `std::unique_ptr<Shape>`, never `Shape`. A pure virtual function in the base is a useful tripwire: an abstract class cannot be copied into, so the by-value versions become compile errors.

(A layout aside visible in that diagram: `Derived::extra` fits in the four padding bytes after `Base::shared`, so `sizeof(Derived) == sizeof(Base) == 16`. The Itanium ABI reuses a base's tail padding for derived members when the base is not a plain C-style struct.)

### 2.7 Multiple inheritance: more than one base means more than one address

With **Multiple Inheritance (多重继承)** a `Service : Logger, Timer` object contains a `Logger` subobject *followed by* a `Timer` subobject, each with its own vptr. Only the first base shares the object's address; converting `Service*` to `Timer*` must *add* the offset of the `Timer` subobject, and the compiler emits that addition at every such conversion. The example prints it: `(Timer*)&svc - &svc = 16 bytes`. When code calls a virtual function through the `Timer*`, `this` points at the `Timer` subobject, so if the override is defined in `Service` the vtable entry points at a small *thunk* that subtracts 16 and jumps to the real function; `dynamic_cast<Service*>` on the `Timer*` uses the `offset-to-top` entry at vtable `-16` to find the start of the complete object again.

```text
Diagram 5 — Service svc;  (Itanium ABI): two subobjects, two vptrs, one object of 32 bytes

  offset  0 ┌──────────────────────┐ ◀── Service* svc, Logger* (same address)
            │ vptr (Logger-in-Service) → primary vtable: offset-to-top 0 ; ~Service ; log
          8 │ log_level = 3   (+pad)│
         16 ├──────────────────────┤ ◀── Timer* = &svc + 16   (the compiler adds 16 on conversion)
            │ vptr (Timer-in-Service) → secondary vtable: offset-to-top -16 ; thunk→~Service ; tick
         24 │ ticks = 0       (+pad)│
         32 └──────────────────────┘
```

Single inheritance never needs any of this, which is one reason most C++ guidance restricts multiple inheritance to *interface* bases with no data.

### 2.8 Compile time versus run time

```text
Diagram 6 — where each decision about a call is made

  COMPILE TIME (g++ reading the class and the call)              RUN TIME (the CPU)
  ────────────────────────────────────────────────────────       ──────────────────────────────────
  is the function virtual?  if not: direct call, may inline      call <fixed address>
  if virtual: which SLOT number (from the base class)            load vptr; load vtable[slot]; call *reg
  does a pointer/reference or an object appear?                  (object by value: direct call, static type)
  build each class's vtable and typeinfo as constant data        the tables sit in .data.rel.ro, read-only
  which constructor/destructor writes which vptr, and when       the stores happen in ctor/dtor prologues
  base subobject offsets; this-pointer adjustments               `add $16` on Service* -> Timer*
  dynamic_cast target type                                       walk typeinfo graph; may return nullptr/throw
```

Everything that makes a call *polymorphic* is prepared by the compiler as tables and offsets; the CPU only ever follows pointers it is handed. That is why the failures in this chapter never produce a compiler error: the tables were built exactly as specified, and the specification did not say what the author meant.

## 3. Complete, Production-Grade Code Example

Three files. `shapes.h` declares an abstract `Shape` with two pure virtual functions, a virtual destructor, one non-virtual function, and two concrete classes. `shapes.cpp` defines `Circle::area` (and therefore hosts `Circle`'s vtable). `main.cpp` measures the layout, compares vptrs between objects, dispatches through a container of `unique_ptr<Shape>`, exercises `dynamic_cast` and `typeid`, demonstrates slicing, and measures the this-pointer adjustment of multiple inheritance. The vptr probe uses `memcpy` on the first eight bytes of an object; that is g++-specific evidence, not portable code, and it is labeled as such.

**`examples/ch05/shapes.h`**
```cpp
// shapes.h -- a small polymorphic hierarchy used to look at vtables and vptrs.
#ifndef CH05_SHAPES_H
#define CH05_SHAPES_H

#include <string>
#include <string_view>

namespace geo {

// Abstract base: two pure virtual functions, one virtual destructor, one data member.
class Shape {
public:
    explicit Shape(std::string label) : label_(std::move(label)) {}
    virtual ~Shape() = default;                              // so `delete Shape*` runs the right destructor

    [[nodiscard]] virtual double area() const = 0;           // dispatched through the vtable
    [[nodiscard]] virtual std::string_view kind() const = 0;
    [[nodiscard]] std::string describe() const;              // NOT virtual: bound at compile time

    [[nodiscard]] const std::string& label() const noexcept { return label_; }

protected:
    std::string label_;   // sits AFTER the vptr in memory
};

class Circle final : public Shape {   // final: nothing may derive from Circle
public:
    Circle(std::string label, double radius) : Shape(std::move(label)), radius_(radius) {}
    [[nodiscard]] double area() const override;
    [[nodiscard]] std::string_view kind() const override { return "circle"; }

private:
    double radius_;
};

class Rect : public Shape {
public:
    Rect(std::string label, double w, double h) : Shape(std::move(label)), w_(w), h_(h) {}
    [[nodiscard]] double area() const override { return w_ * h_; }
    [[nodiscard]] std::string_view kind() const override { return "rect"; }
    [[nodiscard]] bool is_square() const noexcept { return w_ == h_; }   // exists only on Rect

private:
    double w_;
    double h_;
};

}  // namespace geo

#endif  // CH05_SHAPES_H
```

**`examples/ch05/shapes.cpp`**
```cpp
// shapes.cpp -- out-of-line definitions; also where g++ emits the vtables.
//
// The Itanium ABI emits a class's vtable in the translation unit that defines its
// first non-inline, non-pure virtual function (the "key function"). For Circle that
// is area(), so `nm -C shapes.o` shows `vtable for geo::Circle` here.
#include "shapes.h"

#include <numbers>
#include <string>

namespace geo {

std::string Shape::describe() const {
    return std::string(kind()) + " \"" + label_ + "\"";   // kind() IS a virtual call, inside a non-virtual one
}

double Circle::area() const { return std::numbers::pi * radius_ * radius_; }

}  // namespace geo
```

**`examples/ch05/main.cpp`**
```cpp
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
```

**Build and run:**
```text
$ g++ -std=c++20 -Wall -Wextra main.cpp shapes.cpp -o main
$ ./main
```
**Terminal Output:**
```text
Chapter 5 probe: g++ 13, x86-64 Linux, Itanium C++ ABI
== 1. Layout: one hidden pointer per polymorphic object ==
  sizeof(Plain)  = 32   (just the std::string)
  sizeof(Shape)  = 40   (vptr 8 + std::string 32)
  sizeof(Circle) = 48   (Shape 40 + double 8)
  sizeof(Rect)   = 56   (Shape 40 + two doubles)
  offset of label_ inside Circle: 8 (the 8 bytes before it are the vptr)

== 2. vptr: set by the constructor, shared by every object of one dynamic type ==
  vptr(c1) == vptr(c2): true  (one vtable per class)
  vptr(c1) == vptr(r1): false  (different classes)
  vptr(c1) != 0:        true  (points into .rodata of the executable)

== 3. Dynamic dispatch: the call site does not know which function it calls ==
  circle "wheel" area = 0.785
  rect "door"    area = 1.600
  rect "tile"    area = 0.090

== 4. dynamic_cast and typeid consult the vtable's type information ==
  c: typeid name "N3geo6CircleE", dynamic_cast<const Rect*> returned nullptr
  r: typeid name "N3geo4RectE", is a Rect, square = true
  typeid(c) == typeid(geo::Circle): true
  dynamic_cast<const Rect&>(circle) threw: std::bad_cast

== 5. Object slicing: copying into a base object cuts the derived part off ==
  sizeof(Base) = 16, sizeof(Derived) = 16
  ref.who()  = Derived   (dynamic type preserved)
  copy.who() = Base      (sliced: a Base is all that exists)
  by_value[0].who() = Base

== 6. Multiple inheritance: a Timer* into a Service does not point at its start ==
  sizeof(Service) = 32 (two vptr+int subobjects of 16)
  (Logger*)&svc - &svc = 0 bytes
  (Timer*)&svc  - &svc = 16 bytes
  dynamic_cast back to Service* restores the address: true
```

Section 3 of the output is the whole chapter in three lines: `report()` was compiled once, with no knowledge of `Circle` or `Rect`, and reached three different `area()` implementations by reading three vptrs. Section 5 shows the same object answering `Derived` through a reference and `Base` after a copy. Section 6's `16 bytes` is the this-pointer adjustment that single inheritance never needs.

## 4. Pitfalls and Anti-Patterns

### Pitfall 1: Deleting through a base pointer without a virtual destructor
**Buggy Snippet:**
```cpp
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
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug
p1_bug.cpp: In function 'int main()':
p1_bug.cpp:21:5: warning: deleting object of polymorphic class type 'Sensor' which has non-virtual destructor might cause undefined behavior [-Wdelete-non-virtual-dtor]
   21 |     delete s;                                // static type: Sensor -> only ~Sensor() runs
      |     ^~~~~~~~
$ ./p1_bug
read = 1                                     # and 8 KiB leaks, silently

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p1_bug.cpp -o p1_asan && ./p1_asan
==2870==ERROR: AddressSanitizer: new-delete-type-mismatch on 0x503000000040 in thread T0:
  object passed to delete has wrong type:
  size of the allocated type:   32 bytes;
  size of the deallocated type: 8 bytes.
    #1 ... in main p1_bug.cpp:21
```
**Underlying Cause:** `delete s` must do two things: run the destructor and free the storage. Because `~Sensor` is not virtual, both are bound to the static type: the compiler emits a direct call to `Sensor::~Sensor` (which does nothing) and then `operator delete(p, sizeof(Sensor))`, with `sizeof(Sensor) == 8`. `BufferedSensor::~BufferedSensor` never runs, so the `std::vector` never frees its 8 KiB, and the allocator is told to release an 8-byte block that is actually 32 bytes. ASan's report is literally that size mismatch. The standard calls the whole thing undefined behavior; g++'s `-Wall` catches the common case, but only when the `delete` and the class are visible together.

**Fix:**
```cpp
struct Sensor {
    virtual ~Sensor() = default;             // one vtable slot; deletion now dispatches
    virtual double read() const { return 0.0; }
};
...
std::unique_ptr<Sensor> s = std::make_unique<BufferedSensor>();   // Chapter 6: no raw delete at all
```
Rule: a class with any virtual function gets a virtual destructor, unless it is documented as never deleted through a base pointer (then make the destructor `protected` and non-virtual, which turns the mistake into a compile error).

### Pitfall 2: Passing a polymorphic object by value
**Buggy Snippet:**
```cpp
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
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug && ./p2_bug     # no warning from g++ or clang++
the animal says ...
```
**Underlying Cause:** Diagram 4. `speak`'s parameter `a` is a `sizeof(Animal)`-byte object in `speak`'s frame; initializing it from `rex` calls `Animal`'s copy constructor, which copies the `Animal` subobject and writes *Animal's* vtable address into `a`'s vptr. The `Dog` part of `rex` is not a part of `a`, could not fit, and is not consulted. `a.sound()` is then a virtual call on an object whose dynamic type is `Animal`, and the compiler may even devirtualize it to a direct call, since `a`'s type is fully known. A Java `speak(Animal a)` would receive a reference and print `woof`; the C++ spelling of that intent is a reference.

**Fix:**
```cpp
void speak(const Animal& a) {                // a reference to the caller's object: no copy, no slice
    std::cout << "the animal says " << a.sound() << '\n';
}
```
Polymorphic types travel by reference, pointer, or smart pointer, never by value. Making the base abstract (a pure virtual `sound()`) turns `void speak(Animal a)` into the compile error `cannot declare parameter 'a' to be of abstract type 'Animal'`, which is the cheapest guard there is.

### Pitfall 3: A virtual call from a constructor
**Buggy Snippet:**
```cpp
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

int main() { Button ok; }
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug && ./p3_bug     # compiles silently
pure virtual method called
terminate called without an active exception
Aborted (core dumped)
```
**Underlying Cause:** Diagram 3. When `Widget::Widget` runs, the object's vptr points at *Widget's* vtable, because `Button`'s constructor has not yet had its turn; `Button::caption_` does not even exist yet. The virtual call inside `initialize()` therefore lands in slot 2 of Widget's table, which holds `__cxa_pure_virtual`, the runtime's trap function, and the program aborts. Had `load_resources` had a body in `Widget`, that body would have run instead, silently doing the wrong thing. Java behaves the opposite way, dispatching to the subclass override even from the superclass constructor (and thereby exposing uninitialized fields); C++ chose the rule that never reads unconstructed memory, at the price of surprising Java developers.

**Fix:**
```cpp
template <typename W, typename... Args>
std::unique_ptr<W> make_widget(Args&&... args) {
    auto w = std::make_unique<W>(std::forward<Args>(args)...);   // fully constructed: vptr = W's
    w->initialize();                                            // now the virtual call dispatches to W
    return w;
}

const auto ok = make_widget<Button>("OK");
```
Two-phase construction, hidden behind a factory so that nobody can forget the second phase. Alternatively, pass whatever the base needs as constructor arguments instead of asking the derived class for it.

### Pitfall 4: A signature mismatch hides instead of overriding
**Buggy Snippet:**
```cpp
struct Shape {
    virtual ~Shape() = default;
    virtual double area() const { return 0.0; }
};

struct Square : Shape {
    explicit Square(double side) : side_(side) {}
    double area() { return side_ * side_; }   // missing `const`: a NEW, non-virtual function
    double side_;
};

const Square sq(3.0);
const Shape& s = sq;
std::cout << "area via Shape& = " << s.area() << '\n';   // expected 9
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug
p4_bug.cpp:8:20: warning: 'virtual double Shape::area() const' was hidden [-Woverloaded-virtual=]
    8 |     virtual double area() const { return 0.0; }
      |                    ^~~~
p4_bug.cpp:13:12: note:   by 'double Square::area()'
$ ./p4_bug
area via Shape& = 0

$ # the same file with `override` added to Square::area, const still missing:
p4_override.cpp:13:12: error: 'double Square::area()' marked 'override', but does not override
```
**Underlying Cause:** A function overrides only if its name, parameter list, and `const`/`&` qualifiers match the base's virtual function exactly. `double area()` and `double area() const` differ, so `Square::area` is an unrelated new function with no vtable slot; `Square`'s table still holds `Shape::area` in slot 2, and the call through `Shape&` reads that slot. Worse, the new function *hides* the inherited one inside `Square`, so `sq.area()` on a non-`const` `Square` would call the new one and `sq.area()` on a `const` one would not compile. g++ 13 warns under `-Wall`; older compilers said nothing.

**Fix:**
```cpp
double area() const override { return side_ * side_; }   // signature verified against the base
```
Write `override` on every overriding function without exception. It costs nothing, and it converts the most silent bug in this chapter into a one-line compile error.

## 5. Summary and Self-Assessment

### Core Takeaways
- A derived object is its base subobject followed by its own members; a class with any virtual function carries one hidden vptr (8 bytes) at offset 0 that points into a per-class vtable in read-only data. The table has two header entries (offset-to-top, typeinfo) followed by one slot per virtual function in base-class order; overriding means filling the same slot with a different address.
- A virtual call is two dependent loads and an indirect call, chosen by the object's dynamic type; a non-virtual call is a fixed address chosen by the static type at compile time. The vptr is written by each constructor in turn and rewritten by each destructor, so virtual calls from constructors and destructors reach the class currently being built, never the derived one.
- A virtual destructor puts deletion in the table so that `delete base_ptr` runs the derived destructor and frees the right size; without it the derived part leaks and the allocator is lied to. `dynamic_cast` and `typeid` read the typeinfo slot at run time and cost far more than a virtual call; `static_cast` down a hierarchy is free and unchecked.
- Copying a polymorphic object into its base slices it: the vptr becomes the base's and the derived members are gone, with no warning, whether by initialization, by-value parameter, or `std::vector<Base>`. Polymorphic objects travel by reference or pointer; `override` on every override and `final` where extension is forbidden turn the silent mismatches into compile errors.

### Guided Challenges
1. **Read the table yourself.** Add a third class `Ring : Shape` to the example with a virtual `double hole_area() const` declared *after* the inherited functions, then compile `shapes.cpp` with `-fdump-lang-class` and find `Vtable for geo::Ring`. Predict, before looking, how many entries it has and at which offset `hole_area` sits, then verify by calling `ring.hole_area()` through a `Ring&` and reading the `add $0x..,%rax` before the `call *` in `objdump -d`.
   **Hint:** the base's slots come first and keep their numbers; new virtuals are appended, and the byte offset in the `add` is the slot number times 8.
2. **Devirtualize.** Mark `Rect` as `final`, compile `main.cpp` at `-O2`, and look for the call to `Rect::area` in `objdump -d -C`; then write a function `double rect_area(const geo::Rect& r) { return r.area(); }` and compare its code with `double shape_area(const geo::Shape& s) { return s.area(); }` in the same object file. Explain why one contains `call *` and the other does not, and what `final` told the compiler that `override` could not.
   **Hint:** `final` makes the dynamic type of a `Rect&` provably `Rect`, so the slot's content is known at compile time; the optimizer can then replace the table lookup with a direct call, or inline the body outright.
