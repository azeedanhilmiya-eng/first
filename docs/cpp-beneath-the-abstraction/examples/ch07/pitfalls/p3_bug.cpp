// p3_bug.cpp -- a dependent name that the compiler cannot know is a type.
//
//   g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug
#include <iostream>
#include <vector>

template <typename Container>
auto first_element(const Container& c) {
    Container::value_type first = *c.begin();   // is Container::value_type a type or a value?
    return first;
}

int main() {
    const std::vector<int> v{7, 8, 9};
    std::cout << first_element(v) << '\n';
    return 0;
}
