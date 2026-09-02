// p1_bug.cpp -- a destructor without a copy constructor: the Rule of Three, broken.
//
//   g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug && ./p1_bug
#include <cstddef>
#include <iostream>

class IntArray {
public:
    explicit IntArray(std::size_t n) : size_(n), data_(new int[n]{}) {}
    ~IntArray() { delete[] data_; }
    // No copy constructor written, so the compiler generates one that copies
    // size_ and data_ member by member: two objects, ONE array.
    [[nodiscard]] std::size_t size() const noexcept { return size_; }

private:
    std::size_t size_;
    int* data_;
};

int main() {
    IntArray a(4);
    IntArray b = a;   // shallow copy: b.data_ == a.data_
    std::cout << "a and b both claim " << b.size() << " ints\n";
    return 0;
}   // b is destroyed: delete[] the array. Then a is destroyed: delete[] it AGAIN.
