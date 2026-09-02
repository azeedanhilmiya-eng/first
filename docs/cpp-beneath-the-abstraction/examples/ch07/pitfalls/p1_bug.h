// p1_bug.h -- declares the template; the definition lives in p1_bug_impl.cpp (the bug).
#ifndef P1_BUG_H
#define P1_BUG_H

template <typename T>
T maximum(T a, T b);   // declaration only: callers can see the recipe's NAME, not its body

#endif
