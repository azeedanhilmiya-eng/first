// p3_bug.cpp — a C-style cast quietly throws away const.
#include <iostream>

namespace config {
const int max_retries = 3;      // a const object: the compiler puts it in .rodata
}

void set_retries(int* slot, int value) {
    *slot = value;
}

int main() {
    std::cout << "before: " << config::max_retries << '\n';
    set_retries((int*)&config::max_retries, 10);   // (int*) silently means const_cast<int*>
    std::cout << "after:  " << config::max_retries << '\n';
    return 0;
}
