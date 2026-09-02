// main.cpp -- the second translation unit. It sees geometry.h (the interface)
// and never geometry.cpp. Every call into geo::distance or geo::Polygon::area
// is compiled as a call to a symbol that main.o cannot resolve by itself.
#include "geometry.h"

#include <cstddef>
#include <iomanip>
#include <iostream>
#include <string_view>
#include <vector>

// Checked by the COMPILER while translating this file. It costs nothing at
// run time and leaves no trace in main.o.
static_assert(geo::square(3.0) == 9.0, "constexpr functions are evaluated at compile time");

namespace {

// Same name as the counter in geometry.cpp, yet a *different* variable:
// anonymous-namespace names have internal linkage, one per translation unit.
std::size_t call_count = 0;

void print_header() {
    std::cout << std::left << std::setw(15) << "polygon" << std::right << std::setw(3) << "n"
              << std::setw(10) << "area" << std::setw(12) << "perimeter" << '\n';
}

void print_row(const geo::Polygon& p) {
    ++call_count;
    std::cout << std::left << std::setw(15) << p.name() << std::right << std::setw(3)
              << p.vertex_count() << std::fixed << std::setprecision(3) << std::setw(10)
              << p.area() << std::setw(12) << p.perimeter() << '\n';
}

// Regular hexagon with side 1. The vertex coordinates are compile-time
// constants, so no trigonometry runs at run time.
std::vector<geo::Point> unit_hexagon() {
    constexpr double h = 0.86602540378443864676;  // sqrt(3) / 2
    return {{1.0, 0.0}, {0.5, h}, {-0.5, h}, {-1.0, 0.0}, {-0.5, -h}, {0.5, -h}};
}

}  // namespace

int main() {
    // GEO_VERSION_STRING and __cplusplus are replaced by the PREPROCESSOR; the
    // compiler only ever sees the literals "1" "." "2" and 202002L.
    std::cout << geo::kLibraryName << " v" << GEO_VERSION_STRING
              << " (__cplusplus = " << __cplusplus << ")\n";

    const std::vector<geo::Polygon> shapes = {
        geo::Polygon("unit-square", {{0.0, 0.0}, {1.0, 0.0}, {1.0, 1.0}, {0.0, 1.0}}),
        geo::Polygon("right-triangle", {{0.0, 0.0}, {4.0, 0.0}, {0.0, 3.0}}),
        geo::Polygon("unit-hexagon", unit_hexagon()),
    };

    print_header();
    for (const geo::Polygon& p : shapes) {
        print_row(p);
    }

    // Two counters, one name, two translation units.
    std::cout << "distance() calls counted inside geometry.cpp: " << geo::distance_call_count()
              << '\n';
    std::cout << "rows printed, counted inside main.cpp:        " << call_count << '\n';
    return 0;
}
