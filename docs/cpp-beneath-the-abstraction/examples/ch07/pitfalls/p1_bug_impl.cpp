// p1_bug_impl.cpp -- the template's definition, hidden in its own translation unit.
#include "p1_bug.h"

template <typename T>
T maximum(T a, T b) {
    return (b < a) ? a : b;
}
// Nothing in THIS file uses maximum<int>, so no instantiation is emitted here.
