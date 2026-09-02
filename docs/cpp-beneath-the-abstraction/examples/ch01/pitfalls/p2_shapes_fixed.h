// p2_shapes_fixed.h -- FIX: mark header-defined functions `inline`.
#ifndef P2_SHAPES_FIXED_H
#define P2_SHAPES_FIXED_H

struct Rect {
    double w;
    double h;
};

// `inline` tells the toolchain: "this definition may appear in many translation
// units; they are all identical; keep one". The compiler emits it as a WEAK
// symbol in a COMDAT group and the linker discards the duplicates.
inline double area(const Rect& r) { return r.w * r.h; }

#endif  // P2_SHAPES_FIXED_H
