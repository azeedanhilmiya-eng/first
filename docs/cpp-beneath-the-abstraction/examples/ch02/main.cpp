// main.cpp — Chapter 2: what the machine sees when C++ talks about "types".
// Every line printed is a deterministic fact about g++ 13 on x86-64 Linux (LP64).
#include <bit>
#include <cstddef>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <limits>
#include <optional>
#include <string>
#include <string_view>
#include <type_traits>
#include <utility>
#include <vector>

#include "bits.h"
#include "overloads.h"

namespace {

void heading(std::string_view text) { std::cout << "\n== " << text << " ==\n"; }

// ---- 1. sizes -------------------------------------------------------------
struct TypeRow { const char* name; std::size_t size; };

void show_sizes() {
    heading("1. sizeof: bytes per object");
    constexpr TypeRow rows[] = {
        {"bool", sizeof(bool)},     {"char", sizeof(char)},          {"short", sizeof(short)},
        {"int", sizeof(int)},       {"long", sizeof(long)},          {"long long", sizeof(long long)},
        {"float", sizeof(float)},   {"double", sizeof(double)},      {"long double", sizeof(long double)},
        {"void*", sizeof(void*)},   {"std::size_t", sizeof(std::size_t)},
        {"std::int8_t", sizeof(std::int8_t)}, {"std::int64_t", sizeof(std::int64_t)},
    };
    for (const TypeRow& r : rows)
        std::cout << "  " << std::left << std::setw(13) << r.name << std::right << r.size << '\n';
    static_assert(sizeof(std::int32_t) == 4, "fixed-width types are exact by definition");
    std::cout << "  int holds " << std::numeric_limits<int>::min() << " .. "
              << std::numeric_limits<int>::max() << " (31 value bits + 1 sign bit)\n";
}

// ---- 2. two's complement --------------------------------------------------
void show_twos_complement() {
    heading("2. Two's complement: the sign is just the top bit's weight");
    const std::int8_t five = 5;
    const std::int8_t minus_five = -5;
    std::cout << "  int8_t    5 = " << bits::pattern(five) << '\n';
    std::cout << "  int8_t   -5 = " << bits::pattern(minus_five) << "  (~5 + 1)\n";
    std::cout << "  int8_t   -1 = " << bits::pattern(std::int8_t{-1}) << '\n';
    std::cout << "  int8_t -128 = " << bits::pattern(std::int8_t{-128}) << '\n';
    // The same 8 bits read as unsigned: 128+64+32+16+8+2+1 = 251.
    const auto same_bits = static_cast<std::uint8_t>(minus_five);
    std::cout << "  uint8_t " << static_cast<int>(same_bits) << " = " << bits::pattern(same_bits)
              << "  <- identical bits, different weight for bit 7\n";
    std::cout << "  int32_t  -1 = " << bits::pattern(-1) << " = " << bits::hex(-1) << '\n';
}

// ---- 3. unsigned wraps, and code that relies on it ------------------------
// FNV-1a: the multiply is *supposed* to drop the high bits.  Unsigned makes
// that a defined modular operation, so this hash is portable and deterministic.
[[nodiscard]] std::uint32_t fnv1a(std::string_view text) noexcept {
    std::uint32_t hash = 2166136261u;
    for (unsigned char byte : text) {
        hash ^= byte;             // byte is promoted to int, then converted to uint32_t
        hash *= 16777619u;        // wraps modulo 2^32 by definition
    }
    return hash;
}

void show_unsigned_wrap() {
    heading("3. Unsigned arithmetic is modular (defined behavior)");
    std::uint8_t odometer = 255;
    odometer += 1;                // computed as int 256, stored modulo 256
    std::cout << "  uint8_t 255 + 1 = " << static_cast<int>(odometer) << '\n';
    std::uint8_t zero = 0;
    zero -= 1;
    std::cout << "  uint8_t   0 - 1 = " << static_cast<int>(zero) << '\n';
    const unsigned max = std::numeric_limits<unsigned>::max();
    std::cout << "  unsigned max + 1 = " << max + 1u << '\n';
    std::cout << "  0u - 1 = " << 0u - 1u << " = " << bits::hex(0u - 1u) << '\n';
    std::cout << "  fnv1a(\"hello\") = " << bits::hex(fnv1a("hello")) << '\n';
}

// ---- 4. signed overflow is UB: test the precondition, never the result -----
[[nodiscard]] std::optional<int> checked_add(int a, int b) noexcept {
    constexpr int max = std::numeric_limits<int>::max();
    constexpr int min = std::numeric_limits<int>::min();
    if (b > 0 && a > max - b) return std::nullopt;   // a + b would exceed INT_MAX
    if (b < 0 && a < min - b) return std::nullopt;   // a + b would go below INT_MIN
    return a + b;                                    // now provably in range
}

void report_add(int a, int b) {
    std::cout << "  checked_add(" << a << ", " << b << ") -> ";
    if (const auto sum = checked_add(a, b)) std::cout << *sum << '\n';
    else                                    std::cout << "overflow, no result\n";
}

void show_signed_overflow() {
    heading("4. Signed overflow is undefined: check before, not after");
    report_add(2147483640, 7);
    report_add(2147483647, 1);
    report_add(-2147483648, -1);
    // -INT_MIN does not fit in int; widen first, then negate.
    const long long widened = -static_cast<long long>(std::numeric_limits<int>::min());
    std::cout << "  -(INT_MIN) computed in long long = " << widened << '\n';
}

// ---- 5. integer promotion and mixed-sign comparison ------------------------
void show_promotion() {
    heading("5. Integer promotion: nothing is computed narrower than int");
    std::uint8_t a = 200, b = 100;
    static_assert(std::is_same_v<decltype(a + b), int>, "uint8_t + uint8_t is an int");
    std::cout << "  uint8_t a = 200, b = 100; a + b = " << a + b << " (sizeof " << sizeof(a + b) << ")\n";
    std::uint8_t stored = a + b;  // silently truncated on store (-Wconversion would flag it)
    std::cout << "  uint8_t stored = a + b   -> " << static_cast<int>(stored) << '\n';
    std::cout << "  std::cout << stored prints '" << stored << "' (uint8_t is unsigned char)\n";
    std::cout << "  ~a = " << ~a << " as int; as uint8_t = " << static_cast<int>(static_cast<std::uint8_t>(~a)) << '\n';

    const int negative = -1;
    const unsigned one = 1u;
    // `negative < one` converts -1 to unsigned first; -Wsign-compare warns, so we spell it out.
    std::cout << std::boolalpha;
    std::cout << "  -1 < 1u  (usual arithmetic conversions) = " << (static_cast<unsigned>(negative) < one)
              << "  because -1 becomes " << static_cast<unsigned>(negative) << '\n';
    std::cout << "  std::cmp_less(-1, 1u)                   = " << std::cmp_less(negative, one) << '\n';
    const std::vector<int> empty;
    std::cout << "  empty.size() - 1 = " << empty.size() - 1 << '\n';
}

// ---- 6. value categories ---------------------------------------------------
// decltype((e)) — note the double parentheses — reports the value category of e:
//   T& -> lvalue,  T&& -> xvalue,  plain T -> prvalue.
// It has to be a macro: passing e to a function would turn it into a named lvalue.
#define VALUE_CATEGORY(e)                                     \
    (std::is_lvalue_reference_v<decltype((e))>   ? "lvalue"   \
     : std::is_rvalue_reference_v<decltype((e))> ? "xvalue"   \
                                                 : "prvalue")

[[nodiscard]] std::string make_name() { return "temp"; }
[[nodiscard]] int& front(std::vector<int>& v) noexcept { return v[0]; }

void show_value_categories() {
    heading("6. Value categories: what an expression IS, not what it names");
    int n = 7;
    const int cn = 7;
    std::vector<int> v{1, 2, 3};
    std::cout << "  n            : " << VALUE_CATEGORY(n) << '\n';
    std::cout << "  n + 1        : " << VALUE_CATEGORY(n + 1) << '\n';
    std::cout << "  42           : " << VALUE_CATEGORY(42) << '\n';
    std::cout << "  \"literal\"    : " << VALUE_CATEGORY("literal") << "  (string literals live in .rodata)\n";
    std::cout << "  std::move(n) : " << VALUE_CATEGORY(std::move(n)) << '\n';
    std::cout << "  make_name()  : " << VALUE_CATEGORY(make_name()) << "  (returns std::string by value: \"" << make_name() << "\")\n";
    std::cout << "  front(v)     : " << VALUE_CATEGORY(front(v)) << "  (returns int&, aliases v[0] = " << front(v) << ")\n";
    std::cout << "  bind(n)            -> " << demo::bind(n) << '\n';
    std::cout << "  bind(cn)           -> " << demo::bind(cn) << '\n';
    std::cout << "  bind(42)           -> " << demo::bind(42) << '\n';
    std::cout << "  bind(std::move(n)) -> " << demo::bind(std::move(n)) << '\n';
}

// ---- 7. casts --------------------------------------------------------------
// A C-era API that never writes through the pointer but was declared with char*.
[[nodiscard]] std::size_t legacy_length(char* s) noexcept {
    std::size_t n = 0;
    while (s[n] != '\0') ++n;
    return n;
}

void show_casts() {
    heading("7. Casts: static_cast converts, reinterpret_cast relabels, const_cast unlocks");
    std::cout << "  static_cast<int>(-3.7)       = " << static_cast<int>(-3.7) << "  (cvttsd2si truncates toward zero)\n";
    std::cout << "  static_cast<int>(1.15 * 100) = " << static_cast<int>(1.15 * 100) << "  (1.15 is really 1.149999...)\n";
    std::cout << "  static_cast<uint8_t>(300)    = " << static_cast<int>(static_cast<std::uint8_t>(300)) << "  (300 mod 256)\n";
    std::cout << "  static_cast<int8_t>(200)     = " << static_cast<int>(static_cast<std::int8_t>(200)) << "  (bits 1100 1000 reread as signed)\n";

    const float one = 1.0f;
    // Viewing any object as bytes through unsigned char* is the one reinterpret_cast
    // the standard blesses.  No instruction is emitted; only the type label changes.
    const auto* bytes = reinterpret_cast<const unsigned char*>(&one);
    std::cout << "  float 1.0f in memory (x86-64 little-endian):";
    for (std::size_t i = 0; i < sizeof one; ++i) std::cout << ' ' << bits::hex(bytes[i]);
    std::cout << '\n';
    const auto as_u32 = std::bit_cast<std::uint32_t>(one);   // value-level reinterpretation
    std::cout << "  std::bit_cast<uint32_t>(1.0f) = " << bits::hex(as_u32) << " = " << bits::pattern(as_u32) << '\n';

    const std::string text = "hello";    // the string object is const here...
    // ...but legacy_length never writes, so removing const for the call is legal.
    std::cout << "  legacy_length(const_cast<char*>(text.c_str())) = "
              << legacy_length(const_cast<char*>(text.c_str())) << ", text still \"" << text << "\"\n";
}

// ---- 8. overload resolution ------------------------------------------------
void show_overloads() {
    heading("8. Overload resolution: picked at compile time from static types");
    const short s = 1;
    const std::uint8_t byte = 7;
    std::cout << "  type_name('a')       -> " << demo::type_name('a')   << "  (exact match)\n";
    std::cout << "  type_name(short{1})  -> " << demo::type_name(s)     << "  (integral promotion)\n";
    std::cout << "  type_name(uint8_t{7})-> " << demo::type_name(byte)  << "  (integral promotion)\n";
    std::cout << "  type_name(true)      -> " << demo::type_name(true)  << "  (bool promotes to int)\n";
    std::cout << "  type_name(1u)        -> " << demo::type_name(1u)    << "  (exact match)\n";
    std::cout << "  type_name(1L)        -> " << demo::type_name(1L)    << "  (exact match)\n";
    std::cout << "  type_name(1.5f)      -> " << demo::type_name(1.5f)  << "  (floating-point promotion)\n";
    std::cout << "  type_name(\"text\")    -> " << demo::type_name("text") << "  (array-to-pointer)\n";
}

}  // namespace

int main() {
    std::cout << "Chapter 2 probe: g++ 13, x86-64 Linux, LP64";
    show_sizes();
    show_twos_complement();
    show_unsigned_wrap();
    show_signed_overflow();
    show_promotion();
    show_value_categories();
    show_casts();
    show_overloads();
    return 0;
}
