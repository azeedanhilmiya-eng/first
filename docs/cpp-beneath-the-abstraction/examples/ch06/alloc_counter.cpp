// alloc_counter.cpp -- replacement global allocation functions.
//
// The C++ standard allows a program to define its own operator new/delete; the
// linker then uses these instead of the library's. They forward to malloc/free
// and bump a counter, which is all the instrumentation this chapter needs.
#include "alloc_counter.h"

#include <cstddef>
#include <cstdlib>
#include <new>

namespace {
std::size_t g_news = 0;
std::size_t g_deletes = 0;
}  // namespace

namespace alloc {
std::size_t news() noexcept { return g_news; }
std::size_t deletes() noexcept { return g_deletes; }
}  // namespace alloc

void* operator new(std::size_t size) {
    ++g_news;
    if (void* p = std::malloc(size == 0 ? 1 : size)) return p;
    throw std::bad_alloc();
}
void* operator new[](std::size_t size) { return operator new(size); }

void operator delete(void* p) noexcept {
    ++g_deletes;
    std::free(p);
}
void operator delete(void* p, std::size_t) noexcept { operator delete(p); }
void operator delete[](void* p) noexcept { operator delete(p); }
void operator delete[](void* p, std::size_t) noexcept { operator delete(p); }
