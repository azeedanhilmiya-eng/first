// p2_shapes.h -- BUG: a function DEFINITION in a header, without `inline`.
#ifndef P2_SHAPES_H
#define P2_SHAPES_H

struct Rect {
    double w;
    double h;
};

// Every translation unit that #includes this header now contains a complete
// copy of area() with external linkage: a strong symbol `area(Rect const&)`.
// Two translation units => two strong symbols with the same name.
double area(const Rect& r) { return r.w * r.h; }

#endif  // P2_SHAPES_H
