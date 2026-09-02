// overloads.cpp — one translation unit; `nm overloads.o` shows the mangled names.
#include "overloads.h"

namespace demo {

std::string_view type_name(char) noexcept        { return "char"; }
std::string_view type_name(int) noexcept         { return "int"; }
std::string_view type_name(unsigned) noexcept    { return "unsigned"; }
std::string_view type_name(long) noexcept        { return "long"; }
std::string_view type_name(double) noexcept      { return "double"; }
std::string_view type_name(const char*) noexcept { return "const char*"; }

std::string_view bind(int&) noexcept       { return "int&"; }
std::string_view bind(const int&) noexcept { return "const int&"; }
std::string_view bind(int&&) noexcept      { return "int&&"; }

}  // namespace demo
