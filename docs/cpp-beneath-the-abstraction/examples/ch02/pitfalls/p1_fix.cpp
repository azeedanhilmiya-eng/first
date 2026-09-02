// p1_fix.cpp — test the PRECONDITION, never the overflowed result.
#include <iostream>
#include <limits>
#include <optional>

// No arithmetic can overflow here: we only compare against the limit.
[[nodiscard]] bool next_would_overflow(int x) noexcept {
    return x == std::numeric_limits<int>::max();
}

// Returns no value instead of producing a value that never existed.
[[nodiscard]] std::optional<int> next_id(int current) noexcept {
    if (next_would_overflow(current)) return std::nullopt;
    return current + 1;          // provably in range
}

int main() {
    const int id = std::numeric_limits<int>::max();
    std::cout << std::boolalpha;
    std::cout << "id = " << id << '\n';
    std::cout << "next_would_overflow(id) = " << next_would_overflow(id) << '\n';
    if (const auto next = next_id(id)) std::cout << "next_id(id) = " << *next << '\n';
    else                               std::cout << "next_id(id) = <exhausted>\n";
    return 0;
}
