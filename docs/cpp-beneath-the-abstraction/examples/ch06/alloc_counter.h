// alloc_counter.h -- count every heap allocation and deallocation in the program.
//
// The program replaces the global operator new/delete (alloc_counter.cpp), so the
// number of heap blocks a smart pointer creates or frees can be measured exactly,
// instead of taken on faith.
#ifndef CH06_ALLOC_COUNTER_H
#define CH06_ALLOC_COUNTER_H

#include <cstddef>

namespace alloc {

[[nodiscard]] std::size_t news() noexcept;     // calls to operator new so far
[[nodiscard]] std::size_t deletes() noexcept;  // calls to operator delete so far

// Snapshot the counters, run a block, report the difference.
struct Window {
    std::size_t news_at_start = news();
    std::size_t deletes_at_start = deletes();
    [[nodiscard]] std::size_t new_blocks() const noexcept { return news() - news_at_start; }
    [[nodiscard]] std::size_t freed_blocks() const noexcept { return deletes() - deletes_at_start; }
};

}  // namespace alloc

#endif  // CH06_ALLOC_COUNTER_H
