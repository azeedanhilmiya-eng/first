// p3_bug.cpp -- a move constructor that is not noexcept: std::vector refuses to use it.
//
//   g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug && ./p3_bug
#include <iostream>
#include <string>
#include <utility>
#include <vector>

class Blob {
public:
    explicit Blob(std::string tag) : tag_(std::move(tag)), payload_(1024, 'x') {}
    Blob(const Blob& other) : tag_(other.tag_), payload_(other.payload_) {
        std::cout << "  copy " << tag_ << " (1 KiB duplicated)\n";
    }
    Blob(Blob&& other) : tag_(std::move(other.tag_)), payload_(std::move(other.payload_)) {  // no noexcept
        std::cout << "  move " << tag_ << " (pointer stolen)\n";
    }

private:
    std::string tag_;
    std::string payload_;
};

int main() {
    std::vector<Blob> blobs;
    for (const char* tag : {"a", "b", "c"}) {
        std::cout << "push " << tag << ":\n";
        blobs.push_back(Blob(tag));   // each reallocation relocates every existing element
    }
    return 0;
}
