// p2_bug_report.cpp -- a second translation unit that also #includes the header,
// exactly as any real project's second .cpp file would.
#include "p2_shapes.h"

double doubled_area(const Rect& r) { return 2.0 * area(r); }
