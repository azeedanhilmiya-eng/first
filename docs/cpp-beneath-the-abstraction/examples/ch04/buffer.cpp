// buffer.cpp -- the five special members, each narrating what it does to memory.
#include "buffer.h"

#include <algorithm>
#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>

namespace own {

int Buffer::copies = 0;
int Buffer::moves = 0;

Buffer::Buffer(std::string name, std::size_t size)
    : name_(std::move(name)),               // members initialize here, in DECLARATION order
      size_(size),
      data_(size == 0 ? nullptr : new int[size]{}) {  // zero-filled; throws std::bad_alloc on failure
    if (size > 1'000'000) {
        delete[] data_;                     // a constructor that throws must clean up itself...
        throw std::length_error("Buffer too large");  // ...because ~Buffer() will NOT run
    }
    std::cout << "  construct \"" << name_ << "\": new int[" << size_ << "] = " << size_ * sizeof(int)
              << " bytes on the heap\n";
}

Buffer::~Buffer() {
    std::cout << "  destroy   \"" << name_ << "\": delete[] " << size_ * sizeof(int) << " bytes\n";
    delete[] data_;                         // delete[] nullptr is a no-op: moved-from objects are safe
}

Buffer::Buffer(const Buffer& other)
    : name_(other.name_ + "-copy"), size_(other.size_), data_(size_ == 0 ? nullptr : new int[size_]) {
    std::copy(other.data_, other.data_ + size_, data_);  // copy the CONTENTS, not the pointer
    ++copies;
    std::cout << "  copy      \"" << other.name_ << "\" -> \"" << name_ << "\": allocated and copied "
              << size_ * sizeof(int) << " bytes\n";
}

Buffer::Buffer(Buffer&& other) noexcept
    : name_(std::move(other.name_)), size_(other.size_), data_(other.data_) {  // steal the pointer
    other.size_ = 0;                        // restore other's invariant: empty, owns nothing
    other.data_ = nullptr;
    other.name_ = "(moved-from)";
    ++moves;
    std::cout << "  move      -> \"" << name_ << "\": stole the pointer to " << size_ * sizeof(int)
              << " bytes; source is now empty\n";
}

Buffer& Buffer::operator=(const Buffer& other) {
    Buffer temporary(other);                // may throw; *this is untouched if it does
    swap(*this, temporary);                 // now *this owns the copy ...
    return *this;                           // ... and `temporary` destroys our old array
}

Buffer& Buffer::operator=(Buffer&& other) noexcept {
    if (this != &other) {
        delete[] data_;                     // release what we own
        name_ = std::move(other.name_);
        size_ = std::exchange(other.size_, 0);
        data_ = std::exchange(other.data_, nullptr);
        other.name_ = "(moved-from)";
        ++moves;
        std::cout << "  move-assign -> \"" << name_ << "\": released ours, stole theirs\n";
    }
    return *this;
}

void swap(Buffer& a, Buffer& b) noexcept {
    using std::swap;
    swap(a.name_, b.name_);
    swap(a.size_, b.size_);
    swap(a.data_, b.data_);                 // three pointer-sized swaps; no bytes of data move
}

}  // namespace own
