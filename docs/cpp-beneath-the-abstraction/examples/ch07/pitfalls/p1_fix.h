// p1_fix.h -- the whole template lives in the header, so every user can instantiate it.
#ifndef P1_FIX_H
#define P1_FIX_H

template <typename T>
T maximum(T a, T b) {
    return (b < a) ? a : b;
}

#endif
