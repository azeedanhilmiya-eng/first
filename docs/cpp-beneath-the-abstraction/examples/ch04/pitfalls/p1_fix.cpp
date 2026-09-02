// p1_fix.cpp -- the Rule of Zero: let a member that already owns correctly do the owning.
//
//   g++ -std=c++20 -Wall -Wextra p1_fix.cpp -o p1_fix && ./p1_fix
#include <cstddef>
#include <iostream>
#include <vector>

class IntArray {
public:
    explicit IntArray(std::size_t n) : data_(n) {}   // std::vector allocates, copies, moves, frees
    [[nodiscard]] std::size_t size() const noexcept { return data_.size(); }
    // No destructor, no copy/move members: the compiler-generated ones are correct
    // because std::vector's own special members do the right thing.

private:
    std::vector<int> data_;
};

int main() {
    IntArray a(4);
    IntArray b = a;   // deep copy: b owns its own array
    std::cout << "a has " << a.size() << " ints, b has " << b.size() << " ints, in two arrays\n";
    return 0;
}   // two destructors, two arrays, two delete[]s
