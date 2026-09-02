# Chapter 7: Templates and Generic Metaprogramming

> Series: C++: From Beginner to Advanced: Beneath the Abstraction
> Standard: C++20 (`-std=c++20`) · Toolchain used for every output below: g++ 13.3 on x86-64 Linux

## 1. Motivation and Mental Model

### Core Problem
C++ has no run-time type information to make one function work for many types, so it generates a separate, fully typed copy of the code for each type you use, at compile time, and templates are the language for writing those recipes and controlling which copies get made.

### Analogy / Python-Java Contrast
A **Template (模板)** is a recipe card with blanks: "take a ___, compare it with a ___, return the larger". The card itself is not food. When you write `maximum(3, 7)` the compiler fills the blanks with `int`, cooks a complete `int maximum(int, int)`, and stores it as an ordinary function; write `maximum(2.5, 1.5)` and it cooks a second, unrelated function for `double`. Each dish is exactly as fast as if you had written it by hand for that type, because you effectively did. The cost is that the kitchen must be able to see the whole recipe every time it cooks, and that a recipe with a mistake in it produces no complaint until someone orders it.

Python needs no recipe: `def maximum(a, b): return a if b < a else b` works on anything, because every `<` is a dynamic lookup at the moment of the call (Chapter 5), and a type that cannot be compared fails only when compared. Java's `<T extends Comparable<T>> T maximum(T a, T b)` looks like a template but is one function: **type erasure** compiles it once with `T` replaced by `Comparable`, boxes every primitive to reach it, and checks the constraint up front. C++ generates one function per type, never boxes, and, until C++20, checked constraints only by *trying to compile the body*, which is where the famous error messages come from. **Concepts (概念)** are C++20's way of writing the constraint on the card, so that the kitchen refuses a bad order in one line instead of failing halfway through the recipe.

## 2. Deep Dive and Low-Level Mechanics

### 2.1 Instantiation: the compiler writes the function you did not

A template definition produces *no code*. Code appears when the template is used with concrete arguments, in a process called **Template Instantiation (模板实例化)**: the compiler substitutes the arguments for the parameters, type-checks the result as if you had written it by hand, and emits it into the current translation unit. The example calls `maximum` with three types and the object file contains three functions:

```text
$ g++ -std=c++20 -c main.cpp && nm -C main.o | grep -E 'maximum<|sum<'
0000000000000e98 t auto sum<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, s
0000000000000e68 t auto sum<int, double, int>(int, double, int)
0000000000000e48 t auto sum<int, int, int>(int, int, int)
00000000000014ba t std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > maximum<std
000000000000148e t double maximum<double>(double, double)
000000000000146e t int maximum<int>(int, int)
```

(`t` rather than `W` because the example's functions sit in an anonymous namespace; a template in an ordinary namespace is emitted as a weak `W` symbol so that the copies produced by different translation units are merged by the linker, exactly as `inline` functions were in Chapter 1.) The instantiated `int maximum<int>(int, int)` is not special: it is a function with a mangled name, a body, and a `call` instruction at each use, and at `-O2` it is inlined like any other small function.

```text
Diagram 1 — one recipe, three dishes: what the compiler emits for the example's maximum<T>

   source (a recipe, no code)                 uses in main()                 object file (nm -C)
   ┌────────────────────────────┐             maximum(3, 7)        ──────▶  int maximum<int>(int, int)
   │ template <typename T>      │ ──deduce T──▶ T = int                         cmp; cmovl; ret
   │ T maximum(T a, T b) {      │             maximum(2.5, 1.5)    ──────▶  double maximum<double>(double, double)
   │   return (b < a) ? a : b;  │ ──deduce T──▶ T = double                      comisd; ...; ret
   │ }                          │             maximum<std::string>(...) ──▶  std::string maximum<std::string>(...)
   └────────────────────────────┘             T stated explicitly              call std::string::compare; ...
   nothing for T = float, T = long, ...: no use, no instantiation, no code
```

Three consequences follow, and each one is a chapter-1 fact in disguise:

- **The definition must be visible at the point of use.** The compiler cannot instantiate a recipe it cannot see, and the linker cannot instantiate anything. Templates therefore live in headers, body included; a template defined in a `.cpp` file is a linker error for every other file (Pitfall 1).
- **Every distinct argument list is a distinct type or function.** `FixedStack<int, 4>` and `FixedStack<int, 8>` share no code and are unrelated types (the example's `static_assert`). This is *code bloat* when it goes unnoticed: a `std::vector` of forty element types is forty copies of `push_back`.
- **Errors surface at instantiation, in the body.** The compiler checks a template's syntax when it reads it, but type errors in the body cannot be found until a concrete `T` arrives, and the diagnostic then points inside the template (Pitfall 2). That is the problem concepts solve.

### 2.2 Class templates and non-type parameters

A **Class Template (类模板)** works the same way for types: `FixedStack<T, N>` is a recipe for a class, and `FixedStack<int, 4>` is a class with `std::array<int, 4>` inside it, `sizeof == 24`, and its own copies of `push`, `pop` and `size`, each instantiated only when first called. `N` is a **Non-Type Template Parameter (非类型模板参数)**: a compile-time constant that becomes part of the type, so the capacity is known when the object is laid out and no heap allocation is needed. The compiler-generated layout is exactly Chapter 3's: `items_` at offset 0, `size_` at offset 16 for the `int, 4` case, no hidden fields.

### 2.3 Template argument deduction and CTAD

Writing `maximum(3, 7)` never mentions `int`. **Template Argument Deduction (模板实参推导)** compares each parameter type with the corresponding argument type and solves for `T`; `T a` against `3` gives `T = int`. Deduction is strict: every occurrence of `T` must agree, so `maximum(1, 2.5)` yields the error "deduced conflicting types" rather than a silent promotion (Pitfall 4). References strip cleanly (`const T&` against a `std::vector<int>` lvalue gives `T = std::vector<int>`), and since C++17 *class template argument deduction* (CTAD) applies the same machinery to constructors: `std::pair p{1, 2.5}` is `std::pair<int, double>` and `std::vector v{1, 2, 3}` is `std::vector<int>`, both confirmed by `std::is_same_v` in the example.

### 2.4 Concepts: naming the requirement

A **Concept (概念)** is a named, compile-time predicate on types. The example defines two:

```cpp
template <typename T> concept Number = std::integral<T> || std::floating_point<T>;
template <typename T> concept Printable = requires(std::ostream& os, const T& value) {
    { os << value } -> std::same_as<std::ostream&>;
};
```

`Number` combines two standard concepts. `Printable` uses a *requires-expression*: a list of expressions that must be well-formed (here `os << value`) with optional constraints on their types. A concept is used as a **Constraint (约束)** in three spellings, and the example shows all three: `template <Number T>` (a constrained parameter), `const Printable auto&... values` (a constrained placeholder, which makes `print_all` an abbreviated function template), and a bare `Number<int>` in an expression, which is simply `true` or `false` at compile time and prints as such.

What a constraint changes is *when and how* a bad use fails:

```text
Diagram 2 — the same mistake (sorting a std::list with a random-access algorithm) with and without constraints

  unconstrained  std::sort(lst.begin(), lst.end())     constrained  std::ranges::sort(lst)
  ───────────────────────────────────────────────      ────────────────────────────────────────────
  overload chosen; body instantiated;                  overload REJECTED before instantiation:
  deep inside stl_algo.h: `__last - __first`           "constraints not satisfied ...
  has no operator- for list iterators                   requires random_access_range<_Range>"
  → 24 lines of diagnostics, first useful one on line 6      → the failing requirement is named
```

Constraints also drive **Overload Resolution (重载决议)**: among viable templates, a more constrained one wins over a less constrained one (*subsumption*), so `void f(std::integral auto)` beats `void f(auto)` for an `int`, without any of the tricks of the next section.

### 2.5 SFINAE: how it was done before concepts

**SFINAE (Substitution Failure Is Not An Error) (替换失败不是错误)** is the older rule that made constraint-like behavior possible: when substituting deduced arguments into a template's *signature* produces an invalid type, the compiler silently drops that candidate instead of reporting an error. The example uses both classic forms:

```text
Diagram 3 — describe(7) with two enable_if overloads: substitution, not selection, does the work

  candidate A: std::enable_if_t<std::is_integral_v<T>, std::string> describe(T)
      T = int  → is_integral_v<int> = true  → enable_if_t<true, string>  = std::string   ✓ viable
  candidate B: std::enable_if_t<std::is_floating_point_v<T>, std::string> describe(T)
      T = int  → is_floating_point_v<int> = false → enable_if_t<false, string> = (no ::type) ✗ dropped, silently
  → exactly one viable candidate remains: A

  has_size<T>: the primary template is the fallback (false_type); the partial specialization
      has_size<T, std::void_t<decltype(std::declval<T>().size())>>
  is tried first; for T = int the expression `int{}.size()` is invalid, substitution fails,
  the specialization is dropped, the primary answers false. For std::vector<int> it succeeds: true.
```

It works, and every pre-C++20 library is built on it, but the intent is encoded as a return-type trick and the error messages when *no* candidate survives are as opaque as ever. `requires` clauses express the same conditions directly, produce readable errors, and subsume each other; new code should use concepts and read SFINAE.

### 2.6 Specialization: overriding the recipe for particular arguments

A **Template Specialization (模板特化)** provides a different definition for specific arguments. The example's `type_name.h` has a primary template that answers `"unknown"`, four *full* specializations (`TypeName<int>` and so on) with complete definitions, and three **Partial Specializations (偏特化)** that match *patterns*: any `T*`, any `const T`, any `std::vector<T>`. The compiler picks the most specialized matching pattern, and because the partial specializations recurse on `T`, `type_name<std::vector<std::string*>>()` assembles `std::vector<std::string*>` from three definitions. This is compile-time pattern matching on types, and it is the mechanism behind `std::hash<T>`, `std::vector<bool>`, and every type trait in `<type_traits>` (`std::is_pointer<T*>` is exactly a partial specialization that inherits from `true_type`).

Only class templates can be partially specialized; a function template can be fully specialized but should usually be overloaded instead, because a full specialization does not participate in overload resolution.

### 2.7 `constexpr` and `consteval`: running code inside the compiler

A **Constant Expression (常量表达式)** is one the compiler can evaluate while compiling. A `constexpr` function may be called in such an expression, in which case the compiler *interprets* it during compilation, or at run time like any function. The example's `fibonacci` does both: `static_assert(fibonacci(20) == 6765)` is checked with no code emitted, `constexpr auto table = fibonacci_table<10>()` builds ten values into a constant, and `fibonacci(n)` with a `volatile` `n` runs the same loop on the CPU. The proof that the compile-time version really removed the work:

```text
$ g++ -std=c++20 -O2 -c main.cpp && objdump -d -C --no-show-raw-insn main.o | grep -E 'mov +\$0x1a6d|mov +\$0x90'
 816:	mov    $0x1a6d,%esi        ; 0x1a6d == 6765: the result of fibonacci(20), as a constant
 841:	mov    $0x90,%esi          ; 0x90 == 144: compile_time_only(12)
$ objdump -d -C main.o | grep -c 'call.*fibonacci'
0                                  ; no run-time call to fibonacci remains for the constant arguments
```

`consteval` (an *immediate function*) removes the run-time option: `compile_time_only(x)` with a run-time `x` is a compile error, which is the tool for things that must never happen at run time, such as building lookup tables or validating format strings. Both are the practical face of **Metaprogramming (元编程)**: the same language, executed by the compiler, producing data and types for the program.

### 2.8 Variadic templates and fold expressions

A **Variadic Template (变参模板)** takes a *parameter pack*, `typename... Ts`, of any length, and a **Fold Expression (折叠表达式)** applies a binary operator across the pack: `(values + ...)` expands `sum(1, 2, 3)` to `1 + (2 + 3)` at compile time. `sizeof...(Ts)` counts the pack, and the comma-fold in `print_all`, `((std::cout << values << ' '), ...)`, is the idiom for "do this for each argument". Every distinct pack is another instantiation: `sum<int, int, int>` and `sum<int, double, int>` are two functions, and the second one's `int + double` follows Chapter 2's usual arithmetic conversions to produce a `double`.

### 2.9 Compile time versus run time

```text
Diagram 4 — nothing in this chapter survives into the binary except the instantiated code and the constants

  COMPILE TIME (g++ reading the templates and their uses)                 RUN TIME (the CPU)
  ─────────────────────────────────────────────────────────────────       ──────────────────────────────
  deduce T for every call; instantiate one function per distinct T        ordinary calls; no dispatch
  choose the most specialized TypeName<...> pattern                        one ordinary function per choice
  evaluate concepts and enable_if conditions to true/false                 (nothing)
  reject or drop candidates; report "constraints not satisfied"           (nothing)
  interpret constexpr calls in constant contexts; build fib table          mov $0x1a6d; a table in .rodata
  expand parameter packs and folds into fixed expressions                  straight-line arithmetic
  lay out FixedStack<int,4> as 24 bytes                                    stack objects, no heap
```

The right-hand column is what makes generic C++ as fast as hand-written C++: by the time the CPU runs, every `T` has been replaced by a concrete type and every decision has been made. The left-hand column is why compiling C++ is slow and why the error messages need concepts.

## 3. Complete, Production-Grade Code Example

Two files. `type_name.h` is a class template with full and partial specializations. `main.cpp` walks through instantiation, a class template with a non-type parameter, concepts in all three spellings, both classic SFINAE idioms, specialization, `constexpr`/`consteval`, variadic templates with folds, and deduction including CTAD.

**`examples/ch07/type_name.h`**
```cpp
// type_name.h -- a class template with full and partial specializations.
//
// The primary template answers "unknown"; each specialization is a separate
// definition the compiler picks by pattern-matching the type argument at
// compile time. No run-time type information is involved.
#ifndef CH07_TYPE_NAME_H
#define CH07_TYPE_NAME_H

#include <string>
#include <vector>

namespace meta {

template <typename T>
struct TypeName {                                   // primary template: the fallback
    static std::string get() { return "unknown"; }
};

template <> struct TypeName<int>    { static std::string get() { return "int"; } };     // full specializations
template <> struct TypeName<double> { static std::string get() { return "double"; } };
template <> struct TypeName<char>   { static std::string get() { return "char"; } };
template <> struct TypeName<std::string> { static std::string get() { return "std::string"; } };

template <typename T>
struct TypeName<T*> {                               // partial: matches ANY pointer type
    static std::string get() { return TypeName<T>::get() + "*"; }   // recursion on the pointee
};

template <typename T>
struct TypeName<const T> {                          // partial: matches const-qualified types
    static std::string get() { return "const " + TypeName<T>::get(); }
};

template <typename T>
struct TypeName<std::vector<T>> {                   // partial: matches every std::vector<T>
    static std::string get() { return "std::vector<" + TypeName<T>::get() + ">"; }
};

// Convenience: meta::type_name<T>() instead of meta::TypeName<T>::get()
template <typename T>
std::string type_name() { return TypeName<T>::get(); }

}  // namespace meta

#endif  // CH07_TYPE_NAME_H
```

**`examples/ch07/main.cpp`**
```cpp
// main.cpp -- Chapter 7: code the compiler writes for you, and how to steer it.
#include <array>
#include <concepts>
#include <cstddef>
#include <iostream>
#include <span>
#include <string>
#include <string_view>
#include <type_traits>
#include <utility>
#include <vector>

#include "type_name.h"

namespace {

void heading(std::string_view text) { std::cout << "\n== " << text << " ==\n"; }

// ---- 1. function templates and instantiation ------------------------------
template <typename T>
T maximum(T a, T b) {           // a recipe; nothing is compiled until it is used with a concrete T
    return (b < a) ? a : b;
}

void show_instantiation() {
    heading("1. A function template is instantiated once per distinct T");
    std::cout << "  maximum(3, 7)         = " << maximum(3, 7) << "   (T deduced as int)\n";
    std::cout << "  maximum(2.5, 1.5)     = " << maximum(2.5, 1.5) << " (T deduced as double)\n";
    std::cout << "  maximum<std::string>  = " << maximum<std::string>("pear", "apple") << " (T stated)\n";
    std::cout << "  three instantiations => three separate functions in the object file (see nm -C)\n";
}

// ---- 2. class templates -------------------------------------------------------
template <typename T, std::size_t N>
class FixedStack {              // N is a NON-TYPE template parameter: a compile-time constant
public:
    void push(const T& value) { items_[size_++] = value; }
    T pop() { return items_[--size_]; }
    [[nodiscard]] std::size_t size() const noexcept { return size_; }
    [[nodiscard]] static constexpr std::size_t capacity() noexcept { return N; }

private:
    std::array<T, N> items_{};  // storage is INSIDE the object: no heap
    std::size_t size_ = 0;
};

void show_class_template() {
    heading("2. A class template stamps out a distinct type per <T, N>");
    FixedStack<int, 4> ints;
    FixedStack<double, 16> doubles;
    ints.push(1); ints.push(2); ints.push(3);
    std::cout << "  FixedStack<int,4>: sizeof = " << sizeof(ints) << " (4 ints + size_t), capacity "
              << ints.capacity() << ", size " << ints.size() << ", pop() = " << ints.pop() << '\n';
    std::cout << "  FixedStack<double,16>: sizeof = " << sizeof(doubles) << " (16 doubles + size_t)\n";
    static_assert(!std::is_same_v<FixedStack<int, 4>, FixedStack<int, 8>>, "N is part of the type");
    std::cout << "  FixedStack<int,4> and FixedStack<int,8> are unrelated types\n";
}

// ---- 3. concepts --------------------------------------------------------------
template <typename T>
concept Number = std::integral<T> || std::floating_point<T>;

template <typename T>
concept Printable = requires(std::ostream& os, const T& value) {   // a requires-expression
    { os << value } -> std::same_as<std::ostream&>;                  // must compile, must return ostream&
};

template <Number T>                                          // constrained template parameter
double average(std::span<const T> values) {
    double total = 0.0;
    for (const T& v : values) total += static_cast<double>(v);
    return values.empty() ? 0.0 : total / static_cast<double>(values.size());
}

void print_all(const Printable auto&... values) {           // constrained abbreviated template
    ((std::cout << values << ' '), ...);                     // fold over the comma operator
    std::cout << '\n';
}

void show_concepts() {
    heading("3. Concepts: requirements checked at the call, in plain language");
    const std::vector<int> readings{3, 4, 8};
    std::cout << "  average<int>({3,4,8}) = " << average(std::span<const int>(readings)) << '\n';
    std::cout << std::boolalpha;
    std::cout << "  Number<int> " << Number<int> << ", Number<double> " << Number<double>
              << ", Number<std::string> " << Number<std::string> << '\n';
    std::cout << "  Printable<int> " << Printable<int> << ", Printable<FixedStack<int,4>> "
              << Printable<FixedStack<int, 4>> << '\n';
    std::cout << "  print_all: ";
    print_all("mixed", 42, 2.5, 'x');
}

// ---- 4. SFINAE: the pre-C++20 way ------------------------------------------
template <typename T, typename = void>
struct has_size : std::false_type {};                        // chosen when the check below fails
template <typename T>
struct has_size<T, std::void_t<decltype(std::declval<T>().size())>> : std::true_type {};

template <typename T>
std::enable_if_t<std::is_integral_v<T>, std::string> describe(T) { return "an integer"; }
template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, std::string> describe(T) { return "a floating-point number"; }

void show_sfinae() {
    heading("4. SFINAE: substitution failure removes a candidate instead of erroring");
    std::cout << "  has_size<std::vector<int>> " << has_size<std::vector<int>>::value
              << ", has_size<int> " << has_size<int>::value << '\n';
    std::cout << "  describe(7) -> " << describe(7) << "; describe(7.0) -> " << describe(7.0) << '\n';
}

// ---- 5. specialization --------------------------------------------------------
void show_specialization() {
    heading("5. Specialization: pattern-matching on the type argument");
    std::cout << "  " << meta::type_name<int>() << " | " << meta::type_name<double*>() << " | "
              << meta::type_name<const char*>() << " | " << meta::type_name<std::vector<int>>() << " | "
              << meta::type_name<std::vector<std::string*>>() << " | " << meta::type_name<float>() << '\n';
}

// ---- 6. constexpr and consteval -------------------------------------------------
constexpr long fibonacci(int n) {                             // usable at compile time AND run time
    long a = 0, b = 1;
    for (int i = 0; i < n; ++i) { const long next = a + b; a = b; b = next; }
    return a;
}

consteval int compile_time_only(int x) { return x * x; }      // MUST be evaluated at compile time

template <std::size_t N>
constexpr std::array<long, N> fibonacci_table() {
    std::array<long, N> table{};
    for (std::size_t i = 0; i < N; ++i) table[i] = fibonacci(static_cast<int>(i));
    return table;
}

void show_constexpr() {
    heading("6. constexpr: the compiler runs the code, the binary holds the answer");
    static_assert(fibonacci(20) == 6765, "checked while compiling");
    constexpr auto table = fibonacci_table<10>();             // computed once, by g++, into .rodata
    std::cout << "  fibonacci(20) = " << fibonacci(20) << "  (a constant in the machine code)\n";
    std::cout << "  compile_time_only(12) = " << compile_time_only(12) << '\n';
    std::cout << "  table: ";
    for (long v : table) std::cout << v << ' ';
    volatile int n = 10;                                      // volatile: the compiler cannot fold this
    std::cout << "\n  fibonacci(n) with n read at run time = " << fibonacci(n) << "  (same function, run-time call)\n";
}

// ---- 7. variadic templates and fold expressions ---------------------------------
template <typename... Ts>
auto sum(Ts... values) { return (values + ...); }              // unary right fold: v0 + (v1 + (v2 + ...))

template <typename... Ts>
constexpr std::size_t count_args(Ts&&...) { return sizeof...(Ts); }

void show_variadic() {
    heading("7. Variadic templates: one recipe, any number of arguments");
    std::cout << "  sum(1, 2, 3)      = " << sum(1, 2, 3) << "   (int)\n";
    std::cout << "  sum(1, 2.5, 3)    = " << sum(1, 2.5, 3) << " (usual arithmetic conversions -> double)\n";
    std::cout << "  sum(std::string)  = " << sum(std::string("a"), std::string("b"), std::string("c")) << '\n';
    std::cout << "  count_args(1, 'x', 2.0, \"s\") = " << count_args(1, 'x', 2.0, "s") << '\n';
}

// ---- 8. deduction --------------------------------------------------------------
void show_deduction() {
    heading("8. Template argument deduction and CTAD");
    std::pair p{1, 2.5};                                       // CTAD: std::pair<int, double>
    std::vector v{1, 2, 3};                                    // CTAD: std::vector<int>
    std::cout << "  std::pair{1, 2.5} is pair<int,double>: " << std::is_same_v<decltype(p), std::pair<int, double>> << '\n';
    std::cout << "  std::vector{1,2,3} is vector<int>:     " << std::is_same_v<decltype(v), std::vector<int>> << '\n';
    std::cout << "  maximum(1, 2.5) would NOT compile: T cannot be both int and double (Pitfall 4)\n";
}

}  // namespace

int main() {
    std::cout << "Chapter 7 probe: g++ 13, x86-64 Linux";
    show_instantiation();
    show_class_template();
    show_concepts();
    show_sfinae();
    show_specialization();
    show_constexpr();
    show_variadic();
    show_deduction();
    return 0;
}
```

**Build and run:**
```text
$ g++ -std=c++20 -Wall -Wextra main.cpp -o main
$ ./main
```
**Terminal Output:**
```text
Chapter 7 probe: g++ 13, x86-64 Linux
== 1. A function template is instantiated once per distinct T ==
  maximum(3, 7)         = 7   (T deduced as int)
  maximum(2.5, 1.5)     = 2.5 (T deduced as double)
  maximum<std::string>  = pear (T stated)
  three instantiations => three separate functions in the object file (see nm -C)

== 2. A class template stamps out a distinct type per <T, N> ==
  FixedStack<int,4>: sizeof = 24 (4 ints + size_t), capacity 4, size 3, pop() = 3
  FixedStack<double,16>: sizeof = 136 (16 doubles + size_t)
  FixedStack<int,4> and FixedStack<int,8> are unrelated types

== 3. Concepts: requirements checked at the call, in plain language ==
  average<int>({3,4,8}) = 5
  Number<int> true, Number<double> true, Number<std::string> false
  Printable<int> true, Printable<FixedStack<int,4>> false
  print_all: mixed 42 2.5 x 

== 4. SFINAE: substitution failure removes a candidate instead of erroring ==
  has_size<std::vector<int>> true, has_size<int> false
  describe(7) -> an integer; describe(7.0) -> a floating-point number

== 5. Specialization: pattern-matching on the type argument ==
  int | double* | const char* | std::vector<int> | std::vector<std::string*> | unknown

== 6. constexpr: the compiler runs the code, the binary holds the answer ==
  fibonacci(20) = 6765  (a constant in the machine code)
  compile_time_only(12) = 144
  table: 0 1 1 2 3 5 8 13 21 34 
  fibonacci(n) with n read at run time = 55  (same function, run-time call)

== 7. Variadic templates: one recipe, any number of arguments ==
  sum(1, 2, 3)      = 6   (int)
  sum(1, 2.5, 3)    = 6.5 (usual arithmetic conversions -> double)
  sum(std::string)  = abc
  count_args(1, 'x', 2.0, "s") = 4

== 8. Template argument deduction and CTAD ==
  std::pair{1, 2.5} is pair<int,double>: true
  std::vector{1,2,3} is vector<int>:     true
  maximum(1, 2.5) would NOT compile: T cannot be both int and double (Pitfall 4)
```

Section 3's `Number<std::string> false` and `Printable<FixedStack<int,4>> false` are concepts evaluated as ordinary compile-time booleans; section 5 is Diagram 3's pattern matching assembling names recursively; section 6's first two lines are the constants that `objdump` showed above.

## 4. Pitfalls and Anti-Patterns

### Pitfall 1: A template defined in a `.cpp` file
**Buggy Snippet:**
```cpp
// p1_bug.h
template <typename T>
T maximum(T a, T b);   // declaration only: callers can see the recipe's NAME, not its body

// p1_bug_impl.cpp
#include "p1_bug.h"
template <typename T>
T maximum(T a, T b) { return (b < a) ? a : b; }   // nothing here uses maximum<int>

// p1_bug.cpp
#include "p1_bug.h"
int main() { std::cout << maximum(3, 7) << '\n'; }   // needs maximum<int>
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p1_bug.cpp p1_bug_impl.cpp -o p1_bug
/usr/bin/ld: /tmp/ccgXnBNv.o: in function `main':
p1_bug.cpp:(.text+0x13): undefined reference to `int maximum<int>(int, int)'
collect2: error: ld returned 1 exit status
```
**Underlying Cause:** Both files compile. `p1_bug.cpp` sees only a declaration, so it emits a call to the mangled name `_Z7maximumIiET_S0_S0_` and an undefined symbol (Chapter 1). `p1_bug_impl.cpp` sees the definition but never *uses* `maximum<int>`, and a template that is not used is not instantiated, so its object file contains no function at all. The linker finds a `U` with no `T`. The Java habit of "declare in one file, implement in another" is right for ordinary functions and wrong for templates, because instantiation is done by the compiler, per translation unit, at the point of use.

**Fix:**
```cpp
// p1_fix.h: the whole template lives in the header
template <typename T>
T maximum(T a, T b) { return (b < a) ? a : b; }
```
Put the definition in the header. (The exception, *explicit instantiation* `template int maximum<int>(int, int);` in the `.cpp`, works only for the types you list, and is a tool for build-time control, not for hiding implementations.)

### Pitfall 2: An unconstrained template meets the wrong type
**Buggy Snippet:**
```cpp
std::list<int> scores{30, 10, 20};
std::sort(scores.begin(), scores.end());   // std::sort needs random-access iterators
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug           # 24 lines; the first six:
In file included from /usr/include/c++/13/algorithm:61,
                 from p2_bug.cpp:4:
/usr/include/c++/13/bits/stl_algo.h: In instantiation of 'constexpr void std::__sort(_RandomAccessIterator, _RandomAccessIterator, _Compare) [with _RandomAccessIterator = std::_List_iterator<int>; ...]':
/usr/include/c++/13/bits/stl_algo.h:4861:18:   required from 'constexpr void std::sort(_RAIter, _RAIter) [with _RAIter = _List_iterator<int>]'
p2_bug.cpp:10:14:   required from here
/usr/include/c++/13/bits/stl_algo.h:1948:50: error: no match for 'operator-' (operand types are 'std::_List_iterator<int>' and 'std::_List_iterator<int>')
```
**Underlying Cause:** `std::sort`'s parameter is named `_RandomAccessIterator` but, being a classic unconstrained template, it accepts *anything* and finds out inside its body: the first thing it does is compute `__last - __first`, and list iterators have no `operator-`, because a linked list cannot subtract positions in constant time. The error is reported at the failing line *inside the library*, with a "required from" chain back to your call. Diagram 2's right-hand column is the same mistake made against the constrained `std::ranges::sort`: `constraints not satisfied ... requires random_access_range<_Range>`, naming the actual requirement.

**Fix:**
```cpp
scores.sort();                               // a linked list sorts by relinking nodes

std::vector<int> fast{30, 10, 20};
std::ranges::sort(fast);                     // constrained: a wrong container is a one-line error
```
When reading an old-style template error, jump to the *first* `error:` line and the last `required from here`; when writing templates, constrain them so that your users never have to.

### Pitfall 3: A dependent name without `typename`
**Buggy Snippet:**
```cpp
template <typename Container>
auto first_element(const Container& c) {
    Container::value_type first = *c.begin();   // is Container::value_type a type or a value?
    return first;
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug
p3_bug.cpp: In function 'auto first_element(const Container&)':
p3_bug.cpp:9:5: error: need 'typename' before 'Container::value_type' because 'Container' is a dependent scope
    9 |     Container::value_type first = *c.begin();   // is Container::value_type a type or a value?
      |     ^~~~~~~~~
p3_bug.cpp:9:26: error: expected ';' before 'first'
```
**Underlying Cause:** Inside a template, `Container` is unknown until instantiation, so `Container::value_type` could name a type (as it does in `std::vector`) or a static data member or an enumerator in some other `Container`. The compiler must parse the template *before* it knows, and the grammar of the line differs completely between the two readings (a declaration versus a multiplication or a call). The rule resolves the ambiguity by assumption: a dependent qualified name is *not* a type unless you say `typename`. This is a two-phase parsing constraint that Java and Python, which parse nothing until the types are known, never expose.

**Fix:**
```cpp
typename Container::value_type first = *c.begin();   // `typename`: this dependent name is a type
// or, better, avoid naming the type:
auto first = *c.begin();
```
The same rule has a sibling: a dependent member *template* must be introduced with `.template`, as in `obj.template get<0>()`.

### Pitfall 4: Deduction from two different argument types
**Buggy Snippet:**
```cpp
template <typename T>
T maximum(T a, T b) { return (b < a) ? a : b; }

std::cout << maximum(1, 2.5) << '\n';   // T = int from `1`, T = double from `2.5`: which?
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug
p4_bug.cpp:12:25: error: no matching function for call to 'maximum(int, double)'
p4_bug.cpp:7:3: note: candidate: 'template<class T> T maximum(T, T)'
p4_bug.cpp:7:3: note:   template argument deduction/substitution failed:
p4_bug.cpp:12:25: note:   deduced conflicting types for parameter 'T' ('int' and 'double')
```
**Underlying Cause:** Deduction is performed independently for each parameter and the results must agree exactly. `T a` against `1` says `T = int`; `T b` against `2.5` says `T = double`; there is no rule that picks the "wider" one, because deduction never applies conversions (that is what keeps it predictable). A Java `max(int, double)` would promote via its fixed overload set; the C++ template has no overload set until deduction succeeds, and here it does not.

**Fix:**
```cpp
maximum<double>(1, 2.5)                    // T stated: 1 converts to 1.0 as an ordinary argument

template <typename A, typename B>
std::common_type_t<A, B> maximum2(A a, B b) { return (b < a) ? a : b; }   // A = int, B = double
```
Either name `T` so that deduction is skipped and normal conversions apply, or give each parameter its own type and compute the result type with `std::common_type_t`.

## 5. Summary and Self-Assessment

### Core Takeaways
- A template is a recipe; instantiation is the compiler writing one concrete function or class per distinct set of arguments, in the translation unit that uses it, as an ordinary (usually weak) symbol. Definitions therefore live in headers, unused templates cost nothing, every distinct argument list is a separate type or function, and errors in a body appear only when a concrete type arrives.
- Deduction solves for the parameters from the argument types without conversions (conflicting deductions are an error; CTAD extends it to constructors). Concepts are compile-time predicates that reject a call before instantiation with a readable message and rank overloads by subsumption; SFINAE is the older mechanism that achieves rejection by making a substitution fail in the signature.
- Specialization is pattern matching on type arguments: full specializations replace the definition for exact types, partial specializations for patterns such as `T*` or `std::vector<T>`, and the most specialized match wins; it is how type traits and `std::hash` are built.
- `constexpr` code runs inside the compiler when the inputs are constant and on the CPU otherwise; `consteval` code only ever runs inside the compiler. Parameter packs and fold expressions expand to fixed expressions at compile time. Nothing generic survives into the binary except concrete code and folded constants.

### Guided Challenges
1. **Count the bloat, then remove it.** Instantiate `FixedStack<T, 8>` for `int`, `long`, `double`, `float`, and `char`, call `push` and `pop` on each, and count the instantiated member functions with `nm -C main.o | grep -c FixedStack`. Then move the parts of `push`/`pop` that do not depend on `T` (the bounds arithmetic on `size_`) into a non-template base class `FixedStackBase` and count again.
   **Hint:** the technique is called *thin template* or *hoisting*; the count you want to see afterwards is the number of `T`-dependent functions only.
2. **Write the constraint, then break it well.** Define a concept `Averageable` that requires a type to be addable to itself, dividable by `double`, and default-constructible, and constrain the example's `average` with it. Call `average` on a `std::span<const std::string>` and compare g++'s message with the one you get after removing the constraint. Then add a second overload `average(std::span<const T>)` constrained only by `std::integral` and explain, using subsumption, which one `average<int>` picks.
   **Hint:** a constraint `A && B` subsumes `A`, so the overload requiring both is "more constrained" and wins when both are satisfied; unrelated constraints make the call ambiguous.
