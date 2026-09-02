// p3_segment.h -- a header that needs Point, so it includes p3_point.h itself.
#ifndef P3_SEGMENT_H
#define P3_SEGMENT_H

#include "p3_point.h"

struct Segment {
    Point from;
    Point to;
};

#endif  // P3_SEGMENT_H
