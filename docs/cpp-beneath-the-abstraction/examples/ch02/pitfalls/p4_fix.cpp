// p4_fix.cpp — give the literal an exact-match overload (or make the call explicit).
#include <iostream>
#include <string>
#include <string_view>

void configure(bool verbose) {
    std::cout << "verbose = " << std::boolalpha << verbose << '\n';
}

void configure(std::string_view profile) {
    std::cout << "profile = " << profile << '\n';
}

// const char* -> std::string_view would still be a user-defined conversion, which
// loses to the standard pointer->bool conversion.  An exact-match overload wins.
void configure(const char* profile) {
    configure(std::string_view{profile});
}

int main() {
    configure("production");
    configure(std::string{"staging"});   // std::string -> string_view (user-defined), bool not viable
    configure(true);
    return 0;
}
