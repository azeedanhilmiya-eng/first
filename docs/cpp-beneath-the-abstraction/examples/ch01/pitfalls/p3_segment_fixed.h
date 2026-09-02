// p3_segment_fixed.h -- `#pragma once` is the non-standard but universally
// supported (g++, clang++, MSVC) one-line alternative to a guard macro.
#pragma once

#include "p3_point_fixed.h"

struct Segment {
    Point from;
    Point to;
};
