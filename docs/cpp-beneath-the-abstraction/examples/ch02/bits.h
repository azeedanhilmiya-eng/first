// bits.h — render the raw object representation of an integer.
//
// `template <typename Int>` means "this works for any integer type"; templates
// are explained in Chapter 7.  Here they only save us eight identical overloads.
#ifndef CH02_BITS_H
#define CH02_BITS_H

#include <cstddef>
#include <string>
#include <type_traits>

namespace bits {

// Two's-complement bit pattern, most significant bit first, grouped in nibbles.
// pattern(std::int8_t{-5}) == "1111 1011"
template <typename Int>
[[nodiscard]] std::string pattern(Int value) {
    static_assert(std::is_integral_v<Int> && !std::is_same_v<Int, bool>,
                  "pattern() shows integer representations only");
    using Unsigned = std::make_unsigned_t<Int>;     // same width, no sign bit
    const Unsigned raw = static_cast<Unsigned>(value); // signed->unsigned: modular, well defined
    constexpr int width = static_cast<int>(sizeof(Unsigned)) * 8;
    std::string out;
    for (int bit = width - 1; bit >= 0; --bit) {
        out += ((raw >> bit) & 1u) ? '1' : '0';
        if (bit % 4 == 0 && bit != 0) out += ' ';
    }
    return out;
}

// Same bytes as fixed-width hexadecimal: hex(std::uint8_t{0x3f}) == "0x3f"
template <typename Int>
[[nodiscard]] std::string hex(Int value) {
    using Unsigned = std::make_unsigned_t<Int>;
    Unsigned raw = static_cast<Unsigned>(value);
    std::string digits(sizeof(Unsigned) * 2, '0');
    for (std::size_t i = digits.size(); i-- > 0; raw >>= 4)
        digits[i] = "0123456789abcdef"[raw & 0xFu];
    return "0x" + digits;
}

}  // namespace bits

#endif  // CH02_BITS_H
