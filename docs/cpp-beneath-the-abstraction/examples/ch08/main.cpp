// main.cpp -- Chapter 8: what the containers do with memory, measured.
#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <deque>
#include <iostream>
#include <list>
#include <map>
#include <numeric>
#include <ranges>
#include <string>
#include <string_view>
#include <unordered_map>
#include <utility>
#include <vector>

#include "alloc_counter.h"

namespace {

void heading(std::string_view text) { std::cout << "\n== " << text << " ==\n"; }
[[nodiscard]] std::uintptr_t addr(const void* p) noexcept { return reinterpret_cast<std::uintptr_t>(p); }

// ---- 1. vector growth ---------------------------------------------------------
void show_vector_growth() {
    heading("1. std::vector growth: capacity doubles, elements move");
    std::cout << "  sizeof(std::vector<int>) = " << sizeof(std::vector<int>) << " (begin, end, end-of-storage)\n";
    std::vector<int> v;
    std::size_t last_capacity = 0;
    int reallocations = 0;
    alloc::Window w;
    for (int i = 1; i <= 17; ++i) {
        v.push_back(i);
        if (v.capacity() != last_capacity) {
            ++reallocations;
            last_capacity = v.capacity();
            std::cout << "  size " << std::string(2 - std::to_string(v.size()).size(), ' ') << v.size()
                      << " -> capacity " << v.capacity() << '\n';
        }
    }
    std::cout << "  17 push_backs: " << reallocations << " reallocations, " << w.new_blocks()
              << " heap blocks allocated, elements contiguous: " << std::boolalpha
              << (addr(&v[16]) - addr(&v[0]) == 16 * sizeof(int)) << '\n';

    std::vector<int> reserved;
    alloc::Window w2;
    reserved.reserve(17);
    for (int i = 1; i <= 17; ++i) reserved.push_back(i);
    std::cout << "  with reserve(17) first: " << w2.new_blocks() << " heap block, capacity " << reserved.capacity() << '\n';
}

// ---- 2. iterator invalidation ---------------------------------------------------
void show_invalidation() {
    heading("2. Invalidation: a reallocation moves every element to a new block");
    std::vector<int> v{1, 2, 3};
    v.shrink_to_fit();
    const std::uintptr_t before = addr(v.data());
    v.push_back(4);                                     // capacity 3 -> 6: new block, old one freed
    std::cout << "  vector: push_back past capacity moved the buffer: " << (addr(v.data()) != before) << '\n';

    std::deque<int> d{1, 2, 3};
    const std::uintptr_t d_first = addr(&d.front());
    for (int i = 0; i < 1000; ++i) d.push_back(i);
    std::cout << "  deque:  1000 push_backs, front() still at the same address: " << (addr(&d.front()) == d_first) << '\n';

    std::list<int> l{1, 2, 3};
    const std::uintptr_t l_first = addr(&l.front());
    for (int i = 0; i < 1000; ++i) l.push_back(i);
    l.erase(std::next(l.begin()));                      // removing a neighbour does not touch the first node
    std::cout << "  list:   1000 push_backs and an erase, front() still at the same address: " << (addr(&l.front()) == l_first) << '\n';
}

// ---- 3. map versus unordered_map ---------------------------------------------------
void show_maps() {
    heading("3. std::map (red-black tree) versus std::unordered_map (hash table)");
    std::cout << "  sizeof(std::map<int,int>) = " << sizeof(std::map<int, int>)
              << ", sizeof(std::unordered_map<int,int>) = " << sizeof(std::unordered_map<int, int>) << '\n';
    const int keys[] = {42, 7, 19, 3, 88, 61, 25, 10};

    alloc::Window wm;
    std::map<int, std::string> ordered;
    for (int k : keys) ordered.emplace(k, "v" + std::to_string(k));
    std::cout << "  map: 8 inserts -> " << wm.new_blocks() << " heap blocks (one tree node each), iteration:";
    for (const auto& [k, v] : ordered) std::cout << ' ' << k;
    std::cout << "  (sorted)\n";

    alloc::Window wu;
    std::unordered_map<int, std::string> hashed;
    for (int k : keys) hashed.emplace(k, "v" + std::to_string(k));
    std::cout << "  unordered_map: 8 inserts -> " << wu.new_blocks()
              << " heap blocks (8 nodes + 1 bucket array), buckets " << hashed.bucket_count()
              << ", load factor " << hashed.load_factor() << ", max " << hashed.max_load_factor() << '\n';
    std::vector<int> order;
    for (const auto& [k, v] : hashed) order.push_back(k);
    std::cout << "  unordered_map iteration is sorted: " << std::ranges::is_sorted(order)
              << "  (bucket order, not key order)\n";
    std::cout << "  lookups: map.count(19) = " << ordered.count(19) << " via O(log n) comparisons; "
              << "unordered_map.count(19) = " << hashed.count(19) << " via hash -> bucket " << hashed.bucket(19) << '\n';
}

// ---- 4. cache locality -----------------------------------------------------------
void show_locality() {
    heading("4. Layout decides speed: contiguous versus node-based");
    std::cout << "  vector<int>: " << sizeof(int) << " bytes per element, 16 per 64-byte cache line\n";
    std::cout << "  list<int>:   node = prev + next + value = " << sizeof(std::_List_node<int>)
              << " bytes, plus allocator overhead, scattered across the heap\n";
    std::cout << "  map<int,int> node: " << sizeof(std::_Rb_tree_node<std::pair<const int, int>>)
              << " bytes (color, parent, left, right, then the 8-byte pair)\n";
}

// ---- 5. algorithms and ranges ----------------------------------------------------------
void show_algorithms() {
    heading("5. Algorithms: iterator pairs and ranges instead of hand-written loops");
    std::vector<int> v{5, 3, 8, 1, 9, 2, 7};
    std::ranges::sort(v);
    std::cout << "  sorted:            ";
    for (int x : v) std::cout << x << ' ';
    const auto big = std::ranges::find_if(v, [](int x) { return x > 6; });
    std::cout << "\n  first > 6:         " << *big << " at index " << std::distance(v.begin(), big) << '\n';
    std::cout << "  sum (accumulate):  " << std::accumulate(v.begin(), v.end(), 0) << '\n';
    std::vector<int> squares;
    std::ranges::transform(v, std::back_inserter(squares), [](int x) { return x * x; });
    std::cout << "  squares:           ";
    for (int x : squares) std::cout << x << ' ';
    const auto removed = std::erase_if(v, [](int x) { return x % 2 == 0; });   // C++20: erase + remove_if in one
    std::cout << "\n  erase_if(even):    removed " << removed << ", left ";
    for (int x : v) std::cout << x << ' ';
    std::cout << "\n  ranges view:       ";
    for (int x : v | std::views::filter([](int x) { return x > 2; }) | std::views::transform([](int x) { return x * 10; }))
        std::cout << x << ' ';                                                 // lazy: no intermediate vector
    std::cout << '\n';
}

// ---- 6. emplace versus push -----------------------------------------------------------
struct Tracked {
    std::string name;
    static inline int constructed = 0, copied = 0, moved = 0;
    explicit Tracked(std::string n) : name(std::move(n)) { ++constructed; }
    Tracked(const Tracked& o) : name(o.name) { ++copied; }
    Tracked(Tracked&& o) noexcept : name(std::move(o.name)) { ++moved; }
};

void show_emplace() {
    heading("6. emplace_back constructs in place; push_back constructs then moves");
    std::vector<Tracked> v;
    v.reserve(4);                                       // no reallocation noise
    v.push_back(Tracked("a"));                          // temporary, then move into the vector
    std::cout << "  push_back(Tracked(\"a\")): constructed " << Tracked::constructed << ", moved " << Tracked::moved
              << ", copied " << Tracked::copied << '\n';
    Tracked::constructed = Tracked::moved = Tracked::copied = 0;
    v.emplace_back("b");                                // arguments forwarded to the constructor in place
    std::cout << "  emplace_back(\"b\"):       constructed " << Tracked::constructed << ", moved " << Tracked::moved
              << ", copied " << Tracked::copied << '\n';
}

}  // namespace

int main() {
    std::cout << "Chapter 8 probe: g++ 13, libstdc++ 13, x86-64 Linux";
    show_vector_growth();
    show_invalidation();
    show_maps();
    show_locality();
    show_algorithms();
    show_emplace();
    return 0;
}
