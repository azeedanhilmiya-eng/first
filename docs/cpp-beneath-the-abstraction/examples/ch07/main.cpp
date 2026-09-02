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
