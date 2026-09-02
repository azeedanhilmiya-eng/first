// p3_fix.cpp — if a value must change, it is not const.  Model that honestly.
#include <iostream>

struct Settings {
    int max_retries = 3;        // mutable state lives in .data, not .rodata
};

void set_retries(Settings& settings, int value) noexcept {
    settings.max_retries = value;
}

int main() {
    Settings settings;
    std::cout << "before: " << settings.max_retries << '\n';
    set_retries(settings, 10);  // no cast at all; the type system agrees with the OS
    std::cout << "after:  " << settings.max_retries << '\n';
    return 0;
}
