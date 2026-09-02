// geometry.cpp -- ONE translation unit: this file plus everything it #includes.
//
// Compiling it alone (g++ -c geometry.cpp) produces geometry.o, which holds
// machine code only for the functions defined here and knows nothing about
// main.cpp. The two object files meet for the first time inside the linker.
#include "geometry.h"

#include <cmath>
#include <cstddef>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace {

// Internal linkage: visible only inside THIS translation unit. main.cpp has a
// variable with exactly the same name; the linker never sees either of them.
std::size_t call_count = 0;

// One term of the shoelace formula. Also internal linkage.
[[nodiscard]] double cross(geo::Point a, geo::Point b) noexcept {
    return a.x * b.y - a.y * b.x;
}

}  // namespace

namespace geo {

double distance(Point a, Point b) noexcept {
    ++call_count;
    return std::sqrt(square(b.x - a.x) + square(b.y - a.y));
}

std::size_t distance_call_count() noexcept { return call_count; }

Polygon::Polygon(std::string name, std::vector<Point> vertices)
    : name_(std::move(name)), vertices_(std::move(vertices)) {
    if (vertices_.size() < 3) {
        throw std::invalid_argument("Polygon needs at least three vertices");
    }
}

double Polygon::area() const noexcept {
    double twice_area = 0.0;
    for (std::size_t i = 0; i < vertices_.size(); ++i) {
        const Point& current = vertices_[i];
        const Point& next = vertices_[(i + 1) % vertices_.size()];  // wraps to vertex 0
        twice_area += cross(current, next);
    }
    return std::abs(twice_area) / 2.0;
}

double Polygon::perimeter() const noexcept {
    double total = 0.0;
    for (std::size_t i = 0; i < vertices_.size(); ++i) {
        total += distance(vertices_[i], vertices_[(i + 1) % vertices_.size()]);
    }
    return total;
}

}  // namespace geo
