// p4_bug.cpp — a string literal is not a std::string; it is a const char[N].
#include <iostream>
#include <string>

void configure(bool verbose) {
    std::cout << "verbose = " << std::boolalpha << verbose << '\n';
}

void configure(const std::string& profile) {
    std::cout << "profile = " << profile << '\n';
}

int main() {
    configure("production");    // Java picks String; C++ picks bool
    return 0;
}
