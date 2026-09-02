// geometry.h -- the public interface of a tiny geometry "library".
//
// A header is never compiled on its own. The preprocessor pastes it, as text,
// into every translation unit that #includes it, so everything here must be
// safe to appear in MANY object files at once: declarations, class definitions,
// and inline/constexpr definitions. Out-of-line definitions live in geometry.cpp.
#ifndef GEOMETRY_H  // include guard: a second #include in the same TU sees this as false
#define GEOMETRY_H

#include <cstddef>
#include <string>
#include <string_view>
#include <vector>

// Preprocessor-only machinery. These names vanish before the compiler runs:
// GEO_VERSION_STRING becomes the three adjacent literals "1" "." "2".
#define GEO_VERSION_MAJOR 1
#define GEO_VERSION_MINOR 2
#define GEO_STRINGIFY_(x) #x                // turns a token into "token"
#define GEO_STRINGIFY(x) GEO_STRINGIFY_(x)  // extra layer so x is macro-expanded first
#define GEO_VERSION_STRING \
    GEO_STRINGIFY(GEO_VERSION_MAJOR) "." GEO_STRINGIFY(GEO_VERSION_MINOR)

namespace geo {

struct Point {
    double x;
    double y;
};

// Declared here, DEFINED in geometry.cpp. Every other translation unit that
// calls it compiles to a reference to an *undefined* symbol that only the
// linker can resolve.
[[nodiscard]] double distance(Point a, Point b) noexcept;

// How many times distance() has run. The counter itself lives in geometry.cpp.
[[nodiscard]] std::size_t distance_call_count() noexcept;

// constexpr functions are implicitly inline: this definition may legally appear
// in every translation unit, and the compiler can evaluate it at compile time.
[[nodiscard]] constexpr double square(double v) noexcept { return v * v; }

// C++17 inline variable: one object shared by all translation units.
inline constexpr std::string_view kLibraryName = "geometry";

class Polygon {
public:
    // Requires at least three vertices; throws std::invalid_argument otherwise.
    Polygon(std::string name, std::vector<Point> vertices);

    // Defined inside the class body => implicitly inline. Each TU that calls
    // one of these may emit its own copy as a *weak* symbol; the linker keeps one.
    [[nodiscard]] std::string_view name() const noexcept { return name_; }
    [[nodiscard]] std::size_t vertex_count() const noexcept { return vertices_.size(); }

    // Declared here, defined out-of-line in geometry.cpp (strong symbols).
    [[nodiscard]] double area() const noexcept;
    [[nodiscard]] double perimeter() const noexcept;

private:
    std::string name_;
    std::vector<Point> vertices_;
};

}  // namespace geo

#endif  // GEOMETRY_H
