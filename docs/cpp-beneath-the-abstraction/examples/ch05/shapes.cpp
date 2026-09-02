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
