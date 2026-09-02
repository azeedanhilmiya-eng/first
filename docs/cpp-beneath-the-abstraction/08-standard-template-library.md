# Chapter 8: The Standard Template Library (STL)

> Series: C++: From Beginner to Advanced: Beneath the Abstraction
> Standard: C++20 (`-std=c++20`) · Toolchain used for every output below: g++ 13.3 on x86-64 Linux

## 1. Motivation and Mental Model

### Core Problem
Every standard container is a specific arrangement of bytes in memory with specific costs for growth, lookup, and traversal, so choosing a container is choosing a memory layout, and using one safely means knowing exactly when it moves your elements.

### Analogy / Python-Java Contrast
Four ways to keep books. A `std::vector` is a single long shelf: the books stand side by side, you can jump to the 417th in one step, and adding one more when the shelf is full means buying a shelf twice as long and carrying every book across. A `std::list` is a treasure hunt: each book sits wherever there was room and has a note saying where the next one is, so inserting in the middle is trivial and reading the whole collection is a walk around the building. A `std::map` is a library's card catalogue kept in sorted order: finding a title takes a dozen "earlier or later?" decisions, and reading the cards in order is free. A `std::unordered_map` is a coat check: the ticket number tells you the hook directly, provided the hooks are not too crowded, and the coats hang in no meaningful order.

Python's `list` is a vector *of pointers*: eight bytes per slot, each pointing at a separate heap object, so `[1, 2, 3]` is four allocations. Its `dict` is a hash table of pointers (compact and insertion-ordered since 3.7). Java's `ArrayList<Integer>` is likewise an array of references to boxed objects; `HashMap` is an array of buckets holding `Node` objects; `TreeMap` is a red-black tree of `Entry` objects. Every one of those puts an indirection between the container and the value, and a garbage-collected heap behind that.

C++ containers store *the values themselves*. `std::vector<int>` is one heap block of 4-byte integers with nothing in between; `std::map<int, int>` puts each key-value pair inside its own tree node; `std::unordered_map` puts each pair inside a list node hanging off a bucket array. That is why the layouts differ so much in speed, why an element's address can change, and why this chapter measures allocations, capacities, and node sizes instead of quoting big-O notation alone. The complexity classes are the same as Java's; the constants, and the invalidation rules, are what a C++ programmer has to know.

## 2. Deep Dive and Low-Level Mechanics

### 2.1 `std::vector`: three pointers and a growth policy

A **Container (容器)** is a class that owns a set of elements and hands out **Iterators (迭代器)** to walk them. `std::vector<T>` is the simplest: three pointers, 24 bytes, into one heap block.

```text
Diagram 1 — std::vector<int> v after 5 push_backs (libstdc++ 13): size 5, capacity 8

  the vector object (24 bytes, on the stack)         one heap block of capacity × sizeof(T) = 32 bytes
  ┌───────────────────────┐                          ┌────┬────┬────┬────┬────┬────┬────┬────┐
  │ begin ────────────────┼─────────────────────────▶│ 1  │ 2  │ 3  │ 4  │ 5  │ ?  │ ?  │ ?  │
  │ end   ────────────────┼──────────────────────────┼────┴────┴────┴────┴────┴──▲─┴────┴────┘
  │ end_of_storage ───────┼──────────────────────────┼─────────────────────────────────────────▲
  └───────────────────────┘                          size() = end - begin = 5   capacity() = 8

  push_back #6, #7, #8: store at *end, ++end                     (no allocation)
  push_back #9: capacity 8 == size 8 → allocate 16 × 4 bytes, MOVE the 8 elements, free the old block,
                then store                                       (every pointer/iterator into the old block is dead)
```

The **Size (大小)** is how many elements exist; the **Capacity (容量)** is how many fit before the next reallocation. When they are equal, `push_back` allocates a new block, relocates every element (with the move constructor if it is `noexcept`, else the copy constructor, Chapter 4), frees the old block, and *then* appends. libstdc++ doubles: the example shows capacities 1, 2, 4, 8, 16, 32 for 17 insertions, six reallocations, six heap blocks. Doubling is what makes the cost **Amortized Complexity (摊还复杂度)** O(1): the total number of element moves across *n* pushes is under 2*n*, even though an individual push occasionally costs *n*. `reserve(n)` performs the one allocation up front (`1 heap block, capacity 17` in the output), and it is the single most effective optimization for a vector whose size is known.

Two properties follow directly from the layout and are the reason `std::vector` is the default container:

- **Contiguity.** `&v[16] - &v[0]` is exactly 16 elements; `v.data()` is a plain `T*` you can hand to a C API; the CPU's prefetcher sees a straight line.
- **Random access.** `v[i]` is `*(begin + i)`, a multiply-add and a load (Chapter 3), and *no bounds check*; `v.at(i)` adds the check and throws `std::out_of_range`.

### 2.2 Iterator invalidation: when the container moves your elements

An iterator is a pointer with manners: for `std::vector` it *is* a pointer wrapped in a class (`sizeof == 8`, compiles to the same code). That means it points at a byte address, and the address is meaningful only while the element still lives there. **Iterator Invalidation (迭代器失效)** is the general name for the moment a container operation makes an existing iterator, pointer, or reference dangle. The rules are properties of the layouts:

| Container | `push_back` / insert at end | insert in the middle | erase | why |
|-----------|-----------------------------|----------------------|-------|-----|
| `std::vector` | *all* iterators, if capacity is exceeded; otherwise only `end()` | all iterators at or after the point (elements shift); all, if reallocated | iterators at or after the erased element | one contiguous block; elements move |
| `std::deque` | all iterators; references and pointers stay valid | all iterators and references | all iterators; references stay for erase at the ends | blocks in a map of blocks; the block map is rebuilt |
| `std::list` | nothing | nothing | only the erased element's iterator | each node is its own allocation, never moved |
| `std::map` / `std::set` | nothing | nothing | only the erased element's iterator | tree nodes are allocated once and re-linked |
| `std::unordered_map` | all iterators when a rehash happens; references and pointers stay valid | same | only the erased element's iterator | nodes never move; the bucket array does |

The example's section 2 verifies three rows: a `push_back` past capacity moved the vector's buffer (`true`), a thousand `push_back`s left the deque's `front()` at the same address, and a thousand `push_back`s plus an `erase` left the list's first node exactly where it was. Pitfall 1 shows the vector row failing in the most common way, appending to a vector inside a range-based `for` over it, and ASan naming the freed block.

```text
Diagram 2 — for (int x : v) { if (x == 2) v.push_back(20); }  with capacity 3 (Pitfall 1)

  before push_back:                        after push_back (reallocation to capacity 6):
  old block ┌───┬───┬───┐                  old block  ┌ ─ ┬ ─ ┬ ─ ┐  FREED
            │ 1 │ 2 │ 3 │                             │   │   │   │  ◀── the range-for's iterator still points here
            └───┴─▲─┴───┘                             └ ─ ┴ ─ ┴ ─ ┘      (its `end` was captured from the old block too)
      iterator ───┘                       new block  ┌───┬───┬───┬───┬───┬───┐
                                                     │ 1 │ 2 │ 3 │20 │ ? │ ? │
                                                     └───┴───┴───┴───┴───┴───┘
  the next ++it and *it read freed memory: ASan "heap-use-after-free"; without ASan, whatever is there now
```

### 2.3 `std::map`: a red-black tree of nodes

`std::map<K, V>` keeps its pairs sorted by key in a **Red-Black Tree (红黑树)**, a self-balancing binary search tree whose height is at most 2·log₂(*n*). The container object is 48 bytes (a header node with the root, leftmost, and rightmost pointers plus the count); every element is a separate heap allocation holding the tree links and the pair:

```text
Diagram 3 — std::map<int, int> after inserting 42, 7, 19 (libstdc++ _Rb_tree_node: 40 bytes each)

  the map object (48 bytes)              heap: one node per element, allocated as inserted, linked by pointers
  ┌────────────────────┐                 ┌───────────────────────────┐
  │ header: color/root │──root──────────▶│ color   4 (+4 pad)        │  node for 19 (black, root after rebalancing)
  │ leftmost/rightmost │                 │ parent  8                 │
  │ node_count = 3     │                 │ left    8 ──▶ node for 7  │  ┌────────────────┐
  └────────────────────┘                 │ right   8 ──▶ node for 42 │  │ ... links 32 ...│
                                         │ pair<const int,int>  8    │  │ {7, v}          │
                                         └───────────────────────────┘  └────────────────┘
  lookup(19):  compare with root → equal: 1 comparison; lookup(88): root → right → ... O(log n) pointer chases
  iteration:   in-order walk: 3 7 10 19 25 42 61 88 — sorted, always
```

The example counts `8 heap blocks` for eight insertions: one node each, none shared, none contiguous. A lookup is O(log *n*) comparisons, and each comparison is a pointer dereference into a different node, which on a large map means a cache miss per level. Iteration is in key order for free; `lower_bound`, `upper_bound`, and range queries are natural. Keys need only `operator<` (or a comparator), which is why `std::map` accepts a `std::string` or a `GridPoint` without any preparation beyond ordering.

### 2.4 `std::unordered_map`: a bucket array and a chain of nodes

A **Hash Table (哈希表)** trades order for speed: `std::hash<K>` turns the key into a `std::size_t`, `hash % bucket_count` picks a **Bucket (桶)**, and the pair is stored in a node reachable from that bucket. libstdc++ threads all nodes onto a *single* singly-linked list and makes each bucket point at the node *before* its first element, so iteration is a walk down that list and a bucket's chain is a segment of it.

```text
Diagram 4 — std::unordered_map<int, int> with 8 keys, bucket_count 13 (libstdc++ 13)

  the map object (56 bytes)        bucket array: 13 pointers (one heap block, rehashed to a prime size)
  ┌────────────────────┐           ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
  │ buckets ───────────┼──────────▶│ ∅ │ ∅ │ ∅ │ • │ ∅ │ ∅ │ • │ • │ ∅ │ ∅ │ • │ ∅ │ • │  bucket 6 ← 19 % 13
  │ bucket_count = 13  │           └───┴───┴───┴─┼─┴───┴───┴─┼─┴─┼─┴───┴───┴─┼─┴───┴─┼─┘
  │ before_begin ──────┼──┐                      ▼           ▼   ▼           ▼       ▼
  │ element_count = 8  │  │       nodes: 16 bytes each (next pointer + pair), one heap block per node
  │ rehash policy      │  └──▶ ┌────────┐   ┌────────┐   ┌────────┐         one singly-linked list of ALL nodes;
  └────────────────────┘       │ next ──┼──▶│ next ──┼──▶│ next ──┼──▶ ...   a bucket points at the node BEFORE
                               │ {10,v} │   │ {25,v} │   │ {61,v} │         its first element
                               └────────┘   └────────┘   └────────┘
  lookup(19): hash(19) = 19 → 19 % 13 = 6 → follow bucket 6 → compare keys along the chain: O(1) on average
  load_factor = 8 / 13 = 0.615;  when it would exceed max_load_factor (1.0) the table REHASHES:
  a bigger prime bucket array is allocated and every node is re-linked (nodes do not move; iterators die)
```

The example's `9 heap blocks` for eight insertions is exactly this picture: eight nodes plus one bucket array (the first insertion into an empty table triggers the allocation of 13 buckets). The **Load Factor (负载因子)** is elements per bucket; a **Rehash (重哈希)** keeps it under `max_load_factor()` so that chains stay short and lookups stay O(1) on average. The worst case, every key in one bucket, is O(*n*) and is what an adversarial or poorly written hash produces. Iteration order is list order (the output shows it is not sorted), and it changes on rehash. Keys need two things the example's Pitfall 4 shows missing: `std::hash<K>` and `operator==`.

For integers libstdc++'s hash is the identity, and the node does not cache the hash (16 bytes); for `std::string` keys the hash is cached in the node so that a rehash need not re-hash the string, at 8 more bytes per node.

### 2.5 Layout decides speed: cache locality

The CPU does not fetch bytes; it fetches 64-byte **Cache Lines (缓存行)**, and a fetch that misses every cache costs on the order of a hundred nanoseconds. **Cache Locality (缓存局部性)** is the property of touching bytes that are near the bytes you touched a moment ago, and the containers differ enormously in it. A `std::vector<int>` packs sixteen elements per line and the hardware prefetcher streams the lines ahead of the loop; a `std::list<int>` puts each 4-byte value in a 24-byte node (two pointers plus the value; the allocator adds more) at whatever address the heap had free, so each step of the walk is a dependent load that may miss:

```text
$ g++ -std=c++20 -O2 bench.cpp && ./bench           (representative run on this machine; 10 million ints)
vector<int> 10M sum: 7.0137 ms
list<int>   10M sum: 55.8474 ms
bytes: vector 40 MB, list nodes >= 240 MB
```

Eight times slower for the same loop, with six times the memory, and the list's nodes here were allocated *mostly* in order; in a long-running program they are scattered and the ratio grows. The same argument applies to `std::map` versus a sorted `std::vector` searched with `std::lower_bound`, and it is why "prefer `std::vector` unless measurements say otherwise" is the standing advice. `std::deque` sits between: fixed-size blocks (512 bytes in libstdc++) reachable through an index, so it has locality inside a block, stable references, and cheap insertion at both ends.

### 2.6 Algorithms and ranges: loops as library calls

The **Algorithms (算法)** in `<algorithm>` and `<numeric>` are function templates over iterator pairs. Because they are templates (Chapter 7), `std::sort(v.begin(), v.end())` is instantiated for `int*`-like iterators with the comparison inlined, and runs as fast as a hand-written loop; the same `std::sort` on a `std::deque` instantiates a different function for a different iterator type. The iterator categories (input, forward, bidirectional, random access, contiguous) are the contract between container and algorithm: `std::sort` needs random access, which is why it rejects a `std::list` (Chapter 7's Pitfall 2) and why `std::list` has its own `sort()`.

C++20 adds **Ranges (范围)**: `std::ranges::sort(v)` takes the container itself, is constrained by concepts, and gives readable errors; `std::ranges::find_if`, `transform`, and the rest follow. *Views* (`v | std::views::filter(...) | std::views::transform(...)`) compose lazily: the example's pipeline produces `30 50 70 90` without building any intermediate vector, because each element flows through the filter and the transform on demand as the loop asks for it. Two idioms deserve a name. The *erase-remove idiom* (`v.erase(std::remove(...), v.end())`) exists because algorithms cannot change a container's size (Pitfall 3); C++20's `std::erase` and `std::erase_if` do both steps in one call and return the count, as the example shows with `removed 2`.

### 2.7 `emplace` versus `push`, and what the counts say

`push_back(T(...))` constructs a temporary and then moves it into the vector's block: `constructed 1, moved 1` in the example. `emplace_back(args...)` forwards the arguments (Chapter 9) to `T`'s constructor *inside* the block: `constructed 1, moved 0`. For a `std::string` member that is one fewer move of a 32-byte object; for a type without a cheap move it is a copy saved. The same pair exists for every container (`emplace`, `try_emplace` for maps, which additionally avoids constructing the value when the key already exists).

### 2.8 Compile time versus run time

```text
Diagram 5 — where the container decisions are made

  COMPILE TIME (g++ instantiating the containers and algorithms)      RUN TIME (the CPU)
  ──────────────────────────────────────────────────────────────      ────────────────────────────────────
  vector<int>: layout 3 pointers; push_back/reserve/operator[]         allocations, memcpy/moves on growth,
    instantiated for int, with the growth policy inlined                a multiply-add per index
  map<int,string>: node type = links + pair, 40+ bytes;                one allocation per insert, O(log n)
    comparator inlined into insert/find                                 dependent loads per lookup
  unordered_map: node type, whether the hash is cached, std::hash<K>    hash, modulo, chain walk; rehash
    resolved (or a compile error if missing)                            when the load factor is exceeded
  algorithms: one function per iterator type; comparisons inlined       tight loops; no dispatch
  ranges views: a chain of small closure objects (Chapter 9)            one pass, no intermediate storage
```

## 3. Complete, Production-Grade Code Example

Three files. `alloc_counter.h`/`alloc_counter.cpp` are the counting `operator new`/`operator delete` from Chapter 6. `main.cpp` measures vector growth and reallocation, checks the invalidation guarantees of three containers, counts the nodes of a `std::map` and a `std::unordered_map`, prints the node sizes behind the locality argument, runs the common algorithms and a ranges pipeline, and counts constructions for `push_back` versus `emplace_back`.

**`examples/ch08/alloc_counter.h`**
```cpp
// alloc_counter.h -- count every heap allocation and deallocation in the program.
//
// The program replaces the global operator new/delete (alloc_counter.cpp), so the
// number of heap blocks a smart pointer creates or frees can be measured exactly,
// instead of taken on faith.
#ifndef CH08_ALLOC_COUNTER_H
#define CH08_ALLOC_COUNTER_H

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

#endif  // CH08_ALLOC_COUNTER_H
```

**`examples/ch08/alloc_counter.cpp`**
```cpp
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
```

**`examples/ch08/main.cpp`**
```cpp
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
```

**Build and run:**
```text
$ g++ -std=c++20 -Wall -Wextra main.cpp alloc_counter.cpp -o main
$ ./main
```
**Terminal Output:**
```text
Chapter 8 probe: g++ 13, libstdc++ 13, x86-64 Linux
== 1. std::vector growth: capacity doubles, elements move ==
  sizeof(std::vector<int>) = 24 (begin, end, end-of-storage)
  size  1 -> capacity 1
  size  2 -> capacity 2
  size  3 -> capacity 4
  size  5 -> capacity 8
  size  9 -> capacity 16
  size 17 -> capacity 32
  17 push_backs: 6 reallocations, 6 heap blocks allocated, elements contiguous: true
  with reserve(17) first: 1 heap block, capacity 17

== 2. Invalidation: a reallocation moves every element to a new block ==
  vector: push_back past capacity moved the buffer: true
  deque:  1000 push_backs, front() still at the same address: true
  list:   1000 push_backs and an erase, front() still at the same address: true

== 3. std::map (red-black tree) versus std::unordered_map (hash table) ==
  sizeof(std::map<int,int>) = 48, sizeof(std::unordered_map<int,int>) = 56
  map: 8 inserts -> 8 heap blocks (one tree node each), iteration: 3 7 10 19 25 42 61 88  (sorted)
  unordered_map: 8 inserts -> 9 heap blocks (8 nodes + 1 bucket array), buckets 13, load factor 0.615385, max 1
  unordered_map iteration is sorted: false  (bucket order, not key order)
  lookups: map.count(19) = 1 via O(log n) comparisons; unordered_map.count(19) = 1 via hash -> bucket 6

== 4. Layout decides speed: contiguous versus node-based ==
  vector<int>: 4 bytes per element, 16 per 64-byte cache line
  list<int>:   node = prev + next + value = 24 bytes, plus allocator overhead, scattered across the heap
  map<int,int> node: 40 bytes (color, parent, left, right, then the 8-byte pair)

== 5. Algorithms: iterator pairs and ranges instead of hand-written loops ==
  sorted:            1 2 3 5 7 8 9 
  first > 6:         7 at index 4
  sum (accumulate):  35
  squares:           1 4 9 25 49 64 81 
  erase_if(even):    removed 2, left 1 3 5 7 9 
  ranges view:       30 50 70 90 

== 6. emplace_back constructs in place; push_back constructs then moves ==
  push_back(Tracked("a")): constructed 1, moved 1, copied 0
  emplace_back("b"):       constructed 1, moved 0, copied 0
```

Section 1 is Diagram 1 measured (six doublings, six blocks, one with `reserve`); section 3 is Diagrams 3 and 4 measured (eight nodes for the tree, eight nodes plus one bucket array for the table, thirteen buckets, load factor 8/13); section 6 is the `emplace` argument in two lines.

## 4. Pitfalls and Anti-Patterns

### Pitfall 1: Appending to a vector while iterating over it
**Buggy Snippet:**
```cpp
std::vector<int> v{1, 2, 3};
for (int x : v) {                 // holds an iterator into v's CURRENT buffer
    if (x == 2) v.push_back(20);  // may reallocate: the buffer moves, the iterator dangles
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug && ./p1_bug     # no warning; output looks right
1 2 3 20

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p1_bug.cpp -o p1_asan && ./p1_asan
==3451==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000018 at pc ...
READ of size 4 at 0x502000000018 thread T0
    #0 ... in main p1_bug.cpp:10
freed by thread T0 here:
    ...
previously allocated by thread T0 here:
    ...
```
**Underlying Cause:** Diagram 2. The range-based `for` expands to `auto it = v.begin(), end = v.end(); it != end; ++it`, capturing two pointers into the block that held capacity 3. `push_back(20)` needs capacity 4, allocates a new block of 6, moves the three ints, and frees the old block. The loop's `it` and `end` still point into the freed block; the next `++it`/`*it` read freed heap memory. glibc had not yet reused the bytes, so the plain build printed the right answer, which is how this bug ships. Python raises nothing here either (appending while iterating a `list` simply makes the loop longer) but never reads freed memory, because its list holds references, not the objects.

**Fix:**
```cpp
const std::size_t original = v.size();      // indices stay valid across reallocation
for (std::size_t i = 0; i < original; ++i) {
    if (v[i] == 2) v.push_back(20);         // v[i] is re-evaluated from the (possibly new) buffer
}
// or: collect into a second vector, then v.insert(v.end(), extra.begin(), extra.end());
```
Never modify a container's size inside a loop that holds its iterators. Indices survive reallocation; iterators do not. If you must erase while iterating, use the iterator that `erase` returns (`it = v.erase(it)`), or `std::erase_if`.

### Pitfall 2: Checking for a key with `operator[]`
**Buggy Snippet:**
```cpp
std::map<std::string, int> stock{{"apple", 3}};
for (const char* item : {"apple", "pear", "plum"}) {
    if (stock[item] > 0) {        // stock["pear"] default-inserts {"pear", 0} and returns 0
        std::cout << item << " in stock\n";
    }
}
std::cout << "distinct items now tracked: " << stock.size() << '\n';   // expected 1
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug && ./p2_bug
apple in stock
distinct items now tracked: 3
```
**Underlying Cause:** `map::operator[]` is specified as "find the key, and if it is absent, *insert* it with a value-initialized mapped value, then return a reference". It must return a reference to something, and a reference cannot be null, so insertion is the only option. Each lookup of a missing key therefore allocates a 40-byte-plus node, rebalances the tree, and leaves a zero behind, silently. Python's `d[key]` raises `KeyError` and Java's `get` returns `null`; the C++ operator was designed for `counts[word]++`, where insertion is the point, and it is unavailable on a `const` map for exactly this reason.

**Fix:**
```cpp
if (const auto it = stock.find(item); it != stock.end() && it->second > 0) { ... }
stock.contains("pear")     // C++20: a plain boolean
stock.at("apple")          // throws std::out_of_range instead of inserting
```
Use `find`, `contains`, `count`, or `at` to ask; use `operator[]` only when inserting a default is what you want.

### Pitfall 3: `std::remove` does not remove
**Buggy Snippet:**
```cpp
std::vector<int> v{1, 3, 2, 3, 4, 3};
std::remove(v.begin(), v.end(), 3);   // shifts the survivors forward; the size is unchanged
for (int x : v) std::cout << x << ' ';   // expected: 1 2 4
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug && ./p3_bug
size 6: 1 2 4 3 4 3
```
**Underlying Cause:** An algorithm receives two iterators and nothing else; it cannot reach the container to shrink it. `std::remove` does the only thing it can: it moves the elements that are *not* equal to 3 to the front of the range, in order, and returns an iterator to the new logical end. The three slots behind that point are left holding whatever the moves left there (here the old values `3 4 3`, unspecified in general). Nothing was removed because nothing *could* be. g++ 13 does not even warn that the return value was discarded here, although `std::remove` is marked `[[nodiscard]]` in newer library versions.

**Fix:**
```cpp
v.erase(std::remove(v.begin(), v.end(), 3), v.end());   // the erase-remove idiom
const auto n = std::erase(w, 3);                        // C++20: one call, returns the count
```
Algorithms rearrange; containers resize. `std::erase`/`std::erase_if` (C++20) are member-aware wrappers that do both, and are the right spelling in new code.

### Pitfall 4: An `unordered_map` key without a hash
**Buggy Snippet:**
```cpp
struct GridPoint { int x; int y; };

std::unordered_map<GridPoint, int> visits;   // needs std::hash<GridPoint> and operator==
visits[GridPoint{1, 2}] = 1;
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug                                  # 166 lines; the first:
p4_bug.cpp:13:40: error: use of deleted function 'std::unordered_map<_Key, _Tp, _Hash, _Pred, _Alloc>::unordered_map() [with _Key = GridPoint; _Tp = int; _Hash = std::hash<GridPoint>; _Pred = std::equal_to<GridPoint>; ...]'
/usr/include/c++/13/bits/unordered_map.h:148:7: note: '...unordered_map()' is implicitly deleted because the default definition would be ill-formed:
/usr/include/c++/13/bits/unordered_map.h:148:7: error: use of deleted function 'std::_Hashtable<...>::_Hashtable() ...'
```
**Underlying Cause:** Diagram 4 needs a number to take modulo the bucket count, and `std::hash<GridPoint>` does not exist: the primary template of `std::hash` is *disabled* (its constructors and call operator are deleted) for types without a specialization (Chapter 7). The table's constructor default-constructs the hasher, which is a deleted function, and the deletion propagates outward through the `_Hashtable` layers until it surfaces as "the default constructor of `unordered_map` is deleted", 166 lines from the actual cause. A `std::map<GridPoint, int>` would have failed differently, on `operator<`. Java's `HashMap` accepts any key because every `Object` inherits `hashCode()` and `equals()`; C++ has no universal base class and no default hash, so the two operations must be supplied.

**Fix:**
```cpp
struct GridPoint {
    int x;
    int y;
    bool operator==(const GridPoint&) const = default;   // C++20: memberwise equality
};

template <>
struct std::hash<GridPoint> {                              // full specialization of the standard trait
    std::size_t operator()(const GridPoint& p) const noexcept {
        return std::hash<int>{}(p.x) ^ (std::hash<int>{}(p.y) << 1);   // combine the two fields
    }
};
```
Provide both. The hash should mix every field that takes part in equality (and no others) and should spread nearby keys across buckets; when the combination matters, borrow `boost::hash_combine`'s formula rather than a plain XOR.

## 5. Summary and Self-Assessment

### Core Takeaways
- `std::vector` is three pointers into one contiguous block; `push_back` is amortized O(1) because the capacity doubles (1, 2, 4, 8, ... in libstdc++), and every doubling moves every element and invalidates every iterator, pointer, and reference. `reserve` removes the doublings, and contiguity makes it the fastest container to traverse and the default choice.
- Iterators point at bytes, so invalidation follows the layout: vector and deque move elements or rebuild their maps; list, map, set, and the hash containers allocate one node per element and never move it, so only erased elements' iterators die (plus every iterator of a hash table when it rehashes).
- `std::map` is a red-black tree of 40-plus-byte nodes with O(log *n*) pointer-chasing lookups and sorted iteration; `std::unordered_map` is a prime-sized bucket array over a chain of 16-plus-byte nodes with O(1) average lookups, unordered iteration, rehashing when the load factor exceeds 1.0, and a requirement for `std::hash` and `operator==` on the key.
- Algorithms are templates over iterator pairs, as fast as hand-written loops and unable to resize containers (hence erase-remove and C++20's `std::erase_if`); ranges add concept-checked, lazily composed views. Prefer `emplace` to construct in place, `find`/`contains` to ask, and measurements to intuition: the same loop over 10 million ints ran eight times slower on a list than on a vector here.

### Guided Challenges
1. **Catch the rehash.** Insert 100 integer keys into a `std::unordered_map<int, int>` one at a time, printing `bucket_count()` whenever it changes, and record the `load_factor()` just before each change. Then take an iterator to the first element before the loop and check, after each insertion, whether `*it` is still readable under `-fsanitize=address`. Finally call `reserve(100)` first and repeat.
   **Hint:** libstdc++ grows to the next prime above the doubled size; the iterator dies when the bucket array is reallocated even though the node it points to never moves, because the iterator also holds a position in the bucket walk.
2. **Beat the map.** Store one million `(int key, int value)` pairs in three ways: a `std::map`, a `std::unordered_map`, and a `std::vector<std::pair<int,int>>` kept sorted and searched with `std::lower_bound`. Measure one million random lookups for each at `-O2`, then measure memory with the counting `operator new` from the example, and explain both results using node sizes and cache lines.
   **Hint:** the sorted vector does the same O(log *n*) comparisons as the tree but over 8-byte elements packed 8 per cache line, and its last few steps stay inside one line.
