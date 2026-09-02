// p3_fix.cpp -- say `typename` (or let `auto` deduce it and avoid naming the type at all).
//
//   g++ -std=c++20 -Wall -Wextra p3_fix.cpp -o p3_fix && ./p3_fix
#include <iostream>
#include <vector>

template <typename Container>
auto first_element(const Container& c) {
    typename Container::value_type first = *c.begin();   // `typename`: this dependent name is a type
    return first;
}

template <typename Container>
auto first_element_auto(const Container& c) {
    auto first = *c.begin();                             // no dependent type name needed
    return first;
}

int main() {
    const std::vector<int> v{7, 8, 9};
    std::cout << first_element(v) << ' ' << first_element_auto(v) << '\n';
    return 0;
}
