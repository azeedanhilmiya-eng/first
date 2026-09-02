// overloads.h — two overload sets used to watch overload resolution happen.
// Which function a call lands on is fixed at compile time from the static types
// (and value categories) of the arguments; nothing is looked up at run time.
#ifndef CH02_OVERLOADS_H
#define CH02_OVERLOADS_H

#include <string_view>

namespace demo {

// Overloaded on parameter TYPE.  Each returns the name of the overload chosen.
[[nodiscard]] std::string_view type_name(char) noexcept;
[[nodiscard]] std::string_view type_name(int) noexcept;
[[nodiscard]] std::string_view type_name(unsigned) noexcept;
[[nodiscard]] std::string_view type_name(long) noexcept;
[[nodiscard]] std::string_view type_name(double) noexcept;
[[nodiscard]] std::string_view type_name(const char*) noexcept;

// Overloaded on the VALUE CATEGORY of the argument (all three take an int).
[[nodiscard]] std::string_view bind(int&) noexcept;        // modifiable lvalue only
[[nodiscard]] std::string_view bind(const int&) noexcept;  // any lvalue; rvalues as fallback
[[nodiscard]] std::string_view bind(int&&) noexcept;       // rvalues: prvalue or xvalue

}  // namespace demo

#endif  // CH02_OVERLOADS_H
