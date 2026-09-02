// buffer.h -- a fixed-size heap array that OWNS its memory: the Rule of Five by hand.
//
// Every special member function prints what it does, so the example's output is a
// trace of exactly which bytes were copied and which pointers were stolen. In real
// code you would write `std::vector<int>` and none of this (the Rule of Zero); this
// class exists to show what vector does for you.
#ifndef CH04_BUFFER_H
#define CH04_BUFFER_H

#include <cstddef>
#include <string>

namespace own {

class Buffer {
public:
    // Class invariant: either data_ == nullptr && size_ == 0, or data_ points to
    // exactly size_ ints that this object owns and nobody else deletes.
    Buffer(std::string name, std::size_t size);   // acquires the array
    ~Buffer();                                    // releases it: RAII

    Buffer(const Buffer& other);                  // deep copy: new array, copy contents
    Buffer& operator=(const Buffer& other);       // copy-and-swap: strong exception safety
    Buffer(Buffer&& other) noexcept;              // steal the pointer; leave `other` empty
    Buffer& operator=(Buffer&& other) noexcept;   // release ours, steal theirs

    [[nodiscard]] std::size_t size() const noexcept { return size_; }
    [[nodiscard]] const std::string& name() const noexcept { return name_; }
    [[nodiscard]] int& operator[](std::size_t i) noexcept { return data_[i]; }
    [[nodiscard]] int operator[](std::size_t i) const noexcept { return data_[i]; }

    // How many times each special member ran: the evidence for copy elision.
    static int copies;
    static int moves;

    friend void swap(Buffer& a, Buffer& b) noexcept;

private:
    std::string name_;      // 32 bytes: libstdc++'s std::string
    std::size_t size_ = 0;  // 8 bytes
    int* data_ = nullptr;   // 8 bytes: the only member that owns something
};

}  // namespace own

#endif  // CH04_BUFFER_H
