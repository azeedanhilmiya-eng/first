// p3_point_fixed.h -- FIX: an include guard makes a second inclusion a no-op.
#ifndef P3_POINT_FIXED_H  // first time: not yet defined, so the body is kept
#define P3_POINT_FIXED_H  // ... and the macro is defined for the rest of the TU

struct Point {
    double x;
    double y;
};

#endif  // P3_POINT_FIXED_H  -- second time: defined, so everything above is skipped
