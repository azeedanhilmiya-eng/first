# Chapter 6: Modern Resource Management

> Series: C++: From Beginner to Advanced: Beneath the Abstraction
> Standard: C++20 (`-std=c++20`) · Toolchain used for every output below: g++ 13.3 on x86-64 Linux

## 1. Motivation and Mental Model

### Core Problem
Heap objects have no scope to end their lives, so C++ needs a way to attach the deterministic destruction of Chapter 4 to a heap object, and **Smart Pointers (智能指针)** do exactly that: a stack object whose destructor deletes a heap object, with the ownership rules written into the type.

### Analogy / Python-Java Contrast
Think of a rental car. A `std::unique_ptr` is a car with exactly one set of keys; you can hand the keys to someone else (a move), and whoever holds them when the trip ends returns the car. Nobody can copy the keys. A `std::shared_ptr` is a car with a tally counter on the dashboard: every driver who climbs in increments it, every driver who leaves decrements it, and the last one out returns the car. A `std::weak_ptr` is a note with the car's parking spot written on it: you can walk to the spot and, if the car is still there, get in (and bump the counter); if it has been returned, the note tells you so, instead of letting you drive a car that is not there.

Java has only the shared model, implemented by a garbage collector that walks the object graph from the roots whenever it decides to and frees whatever is unreachable, cycles included, at a moment you do not control and cannot observe. Python has the tally counter built into every object (`ob_refcnt`, Chapter 2), so most objects die the instant their count reaches zero, plus a cycle collector for the cases the counter cannot handle.

C++ has none of it built in. A raw pointer from `new` is a bare address with no count, no owner, and no collector: the memory is released only by a matching `delete`, and the language will neither remind you nor stop you from deleting twice. The standard library's smart pointers add ownership back as *ordinary classes*, which means three things a Java developer should notice: the mechanism is visible (you can measure the counter and the control block), it costs exactly what it does and nothing when you do not use it, and it is deterministic, so a file closes or a lock releases at a line you can point to. This chapter measures all of it with a replacement `operator new` that counts heap blocks.

## 2. Deep Dive and Low-Level Mechanics

### 2.1 Ownership is a design decision, and the type should say it

Every heap object has, at every moment, exactly one answer to the question "who will delete this?" **Ownership (所有权)** is the name for that answer, and the failure modes of raw pointers are all failures to keep it straight: nobody deletes (a **Memory Leak (内存泄漏)**), two parties delete (a double free), or one party deletes while another still reads (a use-after-free). The modern discipline is to encode the answer in the type of the handle:

| Handle | Says | Cost |
|--------|------|------|
| `T*` or `T&` | "I do not own this; someone else keeps it alive" | nothing |
| `std::unique_ptr<T>` | "I am the one owner; I delete it when I die" | nothing beyond a raw pointer |
| `std::shared_ptr<T>` | "I am one of *n* owners; the last one deletes it" | two pointers, a heap control block, atomic counting |
| `std::weak_ptr<T>` | "I may look, but I keep nothing alive" | two pointers; shares the control block |

The rules that follow: a function that only *uses* an object takes `T&` or `T*` (the example's `inspect(const Node&)`), a function that *takes over* an object takes `std::unique_ptr<T>` by value (`consume`), and `std::shared_ptr` appears only when ownership is genuinely shared, which is rarer than Java habits suggest. `new` and `delete` should not appear in application code at all; `std::make_unique` and `std::make_shared` replace them.

### 2.2 `std::unique_ptr`: a raw pointer with a destructor

A `std::unique_ptr<T>` is one pointer, `sizeof == 8`, exactly like `T*`; the example prints both. Its destructor calls `delete` on that pointer, its move constructor copies the pointer and nulls the source, and its copy constructor is `= delete`, so **Unique Ownership (独占所有权)** is enforced at compile time (Pitfall 1). Everything else is forwarding: `*p`, `p->`, `p.get()`.

```text
Diagram 1 — std::unique_ptr<Node> b = std::move(a);   (8-byte objects, one 4-byte Node on the heap)

   before                                         after
      a  ┌──────────┐                                a  ┌──────────┐
         │ ptr ─────┼──────┐                            │ ptr = 0  │   "null": nothing to delete
         └──────────┘      │                            └──────────┘
      b  ┌ ─ ─ ─ ─ ─┐      ▼          heap           b  ┌──────────┐
         │ (raw)    │   ┌────────┐                      │ ptr ─────┼──────▶ ┌────────┐
         └ ─ ─ ─ ─ ─┘   │ id = 1 │                      └──────────┘        │ id = 1 │
                        └────────┘                                          └────────┘
   ~b at scope end:  if (ptr) delete ptr;   ~a:  if (0) ...  → nothing
```

The zero-overhead claim is measurable. Compile a raw delete and a `unique_ptr` reset at `-O2`:

```text
$ g++ -std=c++20 -O2 -c up.cpp && objdump -d -C --no-show-raw-insn up.o
<raw_delete(Node*)>:
   test   %rdi,%rdi                 ; if (p)
   je     ret
   mov    $0x4,%esi                 ;   operator delete(p, sizeof(Node))
   jmp    operator delete
<smart_delete(std::unique_ptr<Node>)>:
   mov    (%rdi),%rax               ; load the pointer out of the unique_ptr object
   movq   $0x0,(%rdi)               ; null it (the moved-from state)
   test   %rax,%rax                 ; if (p)
   je     ret
   mov    $0x4,%esi
   mov    %rax,%rdi
   jmp    operator delete           ;   operator delete(p, sizeof(Node))
```

The delete path is identical. The two extra instructions are an honest cost of a different kind: `std::unique_ptr` has a non-trivial destructor, so the x86-64 ABI passes it *in memory* rather than in a register, and the callee has to load the pointer from the caller's slot. It is a few cycles per call, not per use, and it is the entire price of never forgetting a `delete`.

Two features make `unique_ptr` more than a `delete` reminder:

- **Arrays.** `std::unique_ptr<T[]>` calls `delete[]` and offers `operator[]`; `std::make_unique<T[]>(n)` value-initializes `n` elements. Mixing the array form of `new` with the non-array `unique_ptr<T>` is undefined behavior that ASan reports precisely (Pitfall 4).
- **Custom Deleters (自定义删除器).** The second template parameter is a callable invoked instead of `delete`. A stateless deleter (an empty struct, a captureless lambda) is stored via the empty-base optimization and adds no bytes; a function pointer adds 8. The example's `Handle` wraps an integer handle from a C-style API: `sizeof(Handle) == 4`, and `close_handle` runs at the closing brace on every exit path, which is RAII for resources that are not memory (files, sockets, mutexes, GPU buffers).

### 2.3 `std::shared_ptr`: two pointers and a control block

**Shared Ownership (共享所有权)** needs a counter that all owners can see, so it cannot live inside any one `shared_ptr` object; it lives in a separate heap object, the **Control Block (控制块)**. A `std::shared_ptr<T>` is therefore two pointers, `sizeof == 16` (the example prints it): one to the object, one to the block. The block holds:

```text
Diagram 2 — libstdc++'s control block; make_shared<Node>(3) then a copy q = p

  std::shared_ptr<Node> p (16 bytes)            heap: ONE block of 24 bytes (make_shared; glibc rounds the chunk to 32)
  ┌──────────────────────┐                      ┌───────────────────────────────────────┐
  │ object pointer ──────┼──────────────────────┼──────────────────────────▶ ┌────────┐ │
  │ control-block ptr ───┼───────┐              │ vptr (block is polymorphic) │ id = 3 │ │
  └──────────────────────┘       │              │ strong count = 2            └────────┘ │
  std::shared_ptr<Node> q        └─────────────▶│ weak count   = 1  ("1" = strong > 0)   │
  ┌──────────────────────┐                      │ (deleter / allocator state, if any)     │
  │ object pointer ──────┼──────────────────────│ the Node lives INSIDE the block ────────┘
  │ control-block ptr ───┼──────────────────────│
  └──────────────────────┘                      └───────────────────────────────────────┘

  sizeof(_Sp_counted_ptr_inplace<Node>) == 24 (vptr 8, strong 4, weak 4, Node 4 + pad) → one 24-byte allocation
```

- **Reference Count (引用计数)**: two of them. The *strong* count is the number of `shared_ptr`s; when it reaches zero the object is destroyed. The *weak* count is the number of `weak_ptr`s (plus one while any strong owner exists); when *it* reaches zero the block itself is freed. Both are updated with atomic instructions (`lock xadd` on x86), because two threads may copy the same `shared_ptr` at once (Chapter 9), and that is the measurable per-copy cost that `unique_ptr` never pays.
- **A deleter and allocator**, type-erased behind the block's vptr, so that `shared_ptr<T>` has the same type regardless of how the object will be destroyed.
- **The object itself**, if the block was made by `std::make_shared`.

That last point is the difference the example measures with the allocation counter. `std::shared_ptr<Node>(new Node(2))` costs **two** heap blocks: the `Node` (from your `new`) and then the control block (from the constructor). `std::make_shared<Node>(3)` costs **one**: a single block that holds the counts and the `Node` side by side, which is also friendlier to the cache. `make_shared` has one drawback, visible in the next section: the object's bytes cannot be returned until the block goes, so a long-lived `weak_ptr` pins a large object's memory even after the object is destroyed.

### 2.4 `std::weak_ptr`: observing without owning

A **Weak Reference (弱引用)** points at the same control block but bumps only the weak count. It cannot be dereferenced directly; it offers two questions. `expired()` asks whether the strong count is zero. `lock()` tries to *become* an owner: if the strong count is still positive it increments it atomically and returns a `shared_ptr`, otherwise it returns an empty one. The example traces the whole lifetime:

```text
Diagram 3 — the example's section 4: owner (shared_ptr) and watcher (weak_ptr) to Node(4), made by make_shared

  event                                strong  weak   Node(4)     control block (one 24-byte heap block)
  ────────────────────────────────────  ──────  ────   ─────────   ─────────────────────────────────
  auto owner = make_shared<Node>(4)       1      1     alive       allocated  (new_blocks = 1)
  watcher = owner                         1      2     alive
  auto locked = watcher.lock()            2      2     alive       lock() succeeded: strong = 2
  } (locked dies)                         1      2     alive
  } (owner dies)                          0      1     ~Node(4)    still allocated  (freed_blocks = 0)
  watcher.expired()                                                → true
  watcher.reset()                         0      0     -           freed      (freed_blocks = 1)
```

The `freed blocks so far = 0` line is the point: with `make_shared` the object's storage is part of the block, so after `~Node(4)` the bytes are still owned by the block until the last `weak_ptr` lets go. That is the price of the single allocation, and it matters only when the object is large and the `weak_ptr` is long-lived.

### 2.5 Cycles, and why the weak pointer exists

Reference counting has one blind spot. If `a` owns `b` and `b` owns `a`, each keeps the other's strong count at one forever; the two locals that created them die, the counts drop from two to one, and nothing else ever touches them. Java's collector finds such islands by tracing from the roots; a counter cannot. This is a **Cyclic Reference (循环引用)**, and it is the standard way to leak with `shared_ptr` (Pitfall 3 shows LeakSanitizer catching it).

```text
Diagram 4 — a cycle (Pitfall 3) versus a parent/child link with a weak back-reference (the example's section 5)

   CYCLE: both edges are shared_ptr                 BROKEN: the back edge is weak_ptr
      a ──▶ [Node A] ──next──▶ [Node B]               team ──▶ [Team] ──members[0]──▶ [Employee]
                ▲                 │                              ▲                        │
                └──────next───────┘                              └──── team (weak) ───────┘
   strong(A) = 2 (a, B.next)                          strong(Team) = 1 (team only)
   strong(B) = 2 (b, A.next)                          strong(Employee) = 1 (members[0])
   locals die: A = 1, B = 1 → never 0                 team dies: Team = 0 → ~Team → members cleared
   ~Node never runs; 2 blocks leak                    → Employee = 0 → ~Employee; 3 blocks, 3 freed
```

The design rule: **ownership must form a tree (or a DAG), and every edge that points "up" or "sideways" is a `weak_ptr` or a raw pointer.** A parent owns its children; a child observes its parent. When an object needs a `shared_ptr` to *itself* (to hand out to a callback, say), it derives from `std::enable_shared_from_this<T>`, which stores a hidden `weak_ptr` in the object that `shared_from_this()` locks; calling it before the object is owned by a `shared_ptr` throws `std::bad_weak_ptr`.

### 2.6 Deterministic destruction versus garbage collection

Put the pieces together and the contrast with a **Garbage Collection (垃圾回收)** runtime is precise. **Deterministic Destruction (确定性析构)** means: the `Node` in section 3 dies at the closing brace after `q.reset()` brought the count to zero, and the example's output shows `~Node(3)` exactly there. A Java object in the same position would die at some later collection, and a finalizer, if any, might run on another thread or never. The cost of determinism is that the *programmer* has to break cycles and has to choose the ownership model; the benefit is that resources other than memory (the `Handle` in section 2) get the same guarantee, which is why C++ has no `try-with-resources` and does not need one.

```text
Diagram 5 — where the decisions of this chapter are made

  COMPILE TIME (types)                                        RUN TIME (the CPU)
  ─────────────────────────────────────────────────────       ──────────────────────────────────────
  unique_ptr copy → `= delete` → compile error                (never reached)
  unique_ptr move → pointer copy + null, inlined              2 stores
  unique_ptr dtor → `if (p) delete p`, inlined                test + call operator delete
  shared_ptr copy → control-block pointer + atomic ++         lock xadd on the strong count
  shared_ptr dtor → atomic --, then if 0: destroy, if 0: free lock xadd; branch; virtual dispose
  make_shared → one allocation of sizeof(block) + sizeof(T)   one call to operator new
  weak_ptr::lock → compare-and-swap loop on strong count      lock cmpxchg
  which deleter runs → stored in the block (shared) or        (shared) virtual call; (unique) direct call
                       in the type (unique)
```

## 3. Complete, Production-Grade Code Example

Three files. `alloc_counter.h`/`alloc_counter.cpp` replace the global `operator new` and `operator delete` with versions that count calls, so that "one allocation" and "still not freed" are measured, not asserted. `main.cpp` walks through `unique_ptr` transfer, a custom deleter for a C-style handle, the control block and `make_shared`, the two counts of a `weak_ptr`, and a parent/child structure with a weak back-reference.

**`examples/ch06/alloc_counter.h`**
```cpp
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
```

**`examples/ch06/alloc_counter.cpp`**
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

**`examples/ch06/main.cpp`**
```cpp
// main.cpp -- Chapter 6: ownership made explicit. Every claim about how many
// heap blocks a smart pointer creates or frees is measured with alloc::Window.
#include <cstddef>
#include <iostream>
#include <memory>
#include <string_view>
#include <utility>
#include <vector>

#include "alloc_counter.h"

namespace {

void heading(std::string_view text) { std::cout << "\n== " << text << " ==\n"; }

// A small object that announces its death, with no heap members of its own,
// so that every allocation counted below belongs to the smart pointer.
struct Node {
    int id;
    explicit Node(int id_) noexcept : id(id_) {}
    ~Node() { std::cout << "  ~Node(" << id << ")\n"; }
};

// ---- 1. unique_ptr ----------------------------------------------------------
[[nodiscard]] std::unique_ptr<Node> make_node(int id) { return std::make_unique<Node>(id); }

void consume(std::unique_ptr<Node> node) {   // by value: the caller must hand over ownership
    std::cout << "  consume() now owns Node(" << node->id << ") and will destroy it\n";
}

void inspect(const Node& node) {             // borrow: no ownership, no smart pointer in the signature
    std::cout << "  inspect() sees Node(" << node.id << ")\n";
}

void show_unique_ptr() {
    heading("1. unique_ptr: exactly one owner, zero overhead");
    std::cout << "  sizeof(Node*) = " << sizeof(Node*) << ", sizeof(unique_ptr<Node>) = "
              << sizeof(std::unique_ptr<Node>) << "  (same bytes, plus a destructor)\n";
    alloc::Window w;
    std::unique_ptr<Node> a = make_node(1);   // one allocation: the Node itself
    inspect(*a);                              // lend it
    std::unique_ptr<Node> b = std::move(a);   // transfer: a is now null
    std::cout << "  after move: a is " << (a ? "non-null" : "null") << ", b owns Node(" << b->id << ")\n";
    consume(std::move(b));                    // give it away; consume() destroys it on return
    std::cout << "  heap blocks: " << w.new_blocks() << " allocated, " << w.freed_blocks() << " freed\n";
}

// ---- 2. custom deleters for C-style handles ----------------------------------
// A fake C API: integer handles that must be released with close_handle().
int open_handle(int id) { std::cout << "  open_handle(" << id << ")\n"; return id; }
void close_handle(int id) { std::cout << "  close_handle(" << id << ")\n"; }

// unique_ptr's "pointer" can be any type that behaves like one: comparable with
// nullptr and convertible to bool. This wrapper makes an int handle qualify.
struct HandleValue {
    int id = -1;
    HandleValue() = default;
    HandleValue(std::nullptr_t) noexcept {}                  // "null" handle
    explicit HandleValue(int id_) noexcept : id(id_) {}
    explicit operator bool() const noexcept { return id >= 0; }
    friend bool operator==(HandleValue a, HandleValue b) noexcept { return a.id == b.id; }
};

struct HandleDeleter {                        // a stateless deleter adds no size
    using pointer = HandleValue;              // tells unique_ptr what it is holding
    void operator()(HandleValue h) const noexcept { close_handle(h.id); }
};
using Handle = std::unique_ptr<int, HandleDeleter>;   // the `int` is irrelevant: `pointer` rules

void show_custom_deleter() {
    heading("2. Custom deleters: RAII for resources that are not memory");
    std::cout << "  sizeof(Handle) = " << sizeof(Handle) << " (the int only: an empty deleter takes no space)\n";
    std::cout << "  sizeof(unique_ptr<Node, void(*)(Node*)>) = " << sizeof(std::unique_ptr<Node, void (*)(Node*)>)
              << " (a function-pointer deleter is stored)\n";
    {
        Handle h{HandleValue(open_handle(7))};
        std::cout << "  using handle " << h.get().id << '\n';
    }                                         // close_handle(7) runs here, exception or not
}

// ---- 3. shared_ptr and the control block --------------------------------------
void show_shared_ptr() {
    heading("3. shared_ptr: the control block, and make_shared versus new");
    std::cout << "  sizeof(shared_ptr<Node>) = " << sizeof(std::shared_ptr<Node>)
              << " (object pointer + control-block pointer)\n";
    {
        alloc::Window w;
        std::shared_ptr<Node> p(new Node(2));         // Node, then a separate control block
        std::cout << "  shared_ptr<Node>(new Node): " << w.new_blocks() << " heap blocks\n";
    }
    {
        alloc::Window w;
        auto p = std::make_shared<Node>(3);           // one block holding both
        std::cout << "  make_shared<Node>:          " << w.new_blocks() << " heap block\n";
        std::shared_ptr<Node> q = p;                  // copy: same object, strong count 2
        std::cout << "  after copy: use_count = " << p.use_count() << ", same object: " << (p.get() == q.get()) << '\n';
        q.reset();
        std::cout << "  after q.reset(): use_count = " << p.use_count() << '\n';
    }                                                 // strong count hits 0: ~Node(3), block freed
}

// ---- 4. weak_ptr: observe without owning ---------------------------------------
void show_weak_ptr() {
    heading("4. weak_ptr: the object dies at strong == 0; the block waits for weak == 0");
    alloc::Window w;
    std::weak_ptr<Node> watcher;
    {
        auto owner = std::make_shared<Node>(4);
        watcher = owner;                              // weak: does not keep Node(4) alive
        std::cout << "  strong = " << owner.use_count() << ", expired = " << watcher.expired() << '\n';
        if (auto locked = watcher.lock()) {           // promotes to a temporary owner, strong = 2
            std::cout << "  lock() succeeded: strong = " << locked.use_count() << '\n';
        }
    }                                                 // owner gone: ~Node(4) runs NOW ...
    std::cout << "  after the owner died: expired = " << watcher.expired()
              << ", freed blocks so far = " << w.freed_blocks() << "  (control block still alive)\n";
    watcher.reset();                                  // ... but the block is freed only here
    std::cout << "  after watcher.reset(): freed blocks = " << w.freed_blocks() << '\n';
}

// ---- 5. breaking a cycle -------------------------------------------------------
struct Employee;
struct Team {
    std::vector<std::shared_ptr<Employee>> members;   // a team owns its employees
    ~Team() { std::cout << "  ~Team\n"; }
};
struct Employee {
    std::weak_ptr<Team> team;                         // an employee only OBSERVES its team
    ~Employee() { std::cout << "  ~Employee\n"; }
};

void show_cycle() {
    heading("5. Parent owns child, child observes parent: no cycle, everything is destroyed");
    alloc::Window w;
    {
        auto team = std::make_shared<Team>();
        auto alice = std::make_shared<Employee>();
        team->members.push_back(alice);
        alice->team = team;                           // weak back-reference
        std::cout << "  team strong = " << team.use_count() << " (a shared_ptr back-reference would make it 2)\n";
        if (auto t = alice->team.lock()) std::cout << "  alice can reach her team: " << t->members.size() << " member\n";
    }
    std::cout << "  blocks: " << w.new_blocks() << " allocated, " << w.freed_blocks() << " freed\n";
}

}  // namespace

int main() {
    std::cout << std::boolalpha << "Chapter 6 probe: g++ 13, libstdc++ 13, x86-64 Linux";
    show_unique_ptr();
    show_custom_deleter();
    show_shared_ptr();
    show_weak_ptr();
    show_cycle();
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
Chapter 6 probe: g++ 13, libstdc++ 13, x86-64 Linux
== 1. unique_ptr: exactly one owner, zero overhead ==
  sizeof(Node*) = 8, sizeof(unique_ptr<Node>) = 8  (same bytes, plus a destructor)
  inspect() sees Node(1)
  after move: a is null, b owns Node(1)
  consume() now owns Node(1) and will destroy it
  ~Node(1)
  heap blocks: 1 allocated, 1 freed

== 2. Custom deleters: RAII for resources that are not memory ==
  sizeof(Handle) = 4 (the int only: an empty deleter takes no space)
  sizeof(unique_ptr<Node, void(*)(Node*)>) = 16 (a function-pointer deleter is stored)
  open_handle(7)
  using handle 7
  close_handle(7)

== 3. shared_ptr: the control block, and make_shared versus new ==
  sizeof(shared_ptr<Node>) = 16 (object pointer + control-block pointer)
  shared_ptr<Node>(new Node): 2 heap blocks
  ~Node(2)
  make_shared<Node>:          1 heap block
  after copy: use_count = 2, same object: true
  after q.reset(): use_count = 1
  ~Node(3)

== 4. weak_ptr: the object dies at strong == 0; the block waits for weak == 0 ==
  strong = 1, expired = false
  lock() succeeded: strong = 2
  ~Node(4)
  after the owner died: expired = true, freed blocks so far = 0  (control block still alive)
  after watcher.reset(): freed blocks = 1

== 5. Parent owns child, child observes parent: no cycle, everything is destroyed ==
  team strong = 1 (a shared_ptr back-reference would make it 2)
  alice can reach her team: 1 member
  ~Team
  ~Employee
  blocks: 3 allocated, 3 freed
```

Every number in the output was drawn in section 2: `2 heap blocks` versus `1 heap block` is Diagram 2, the `freed blocks so far = 0` line is the last two rows of Diagram 3, and `3 allocated, 3 freed` with both destructors printed is the right-hand side of Diagram 4.

## 4. Pitfalls and Anti-Patterns

### Pitfall 1: Copying a `unique_ptr`
**Buggy Snippet:**
```cpp
void register_connection(std::unique_ptr<Connection> c, std::vector<std::unique_ptr<Connection>>& pool) {
    pool.push_back(std::move(c));
}

std::unique_ptr<Connection> conn = std::make_unique<Connection>(1);
register_connection(conn, pool);   // tries to COPY the unique_ptr: two owners of one object
std::cout << "still have conn " << conn->id << '\n';
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug
p1_bug.cpp:19:24: error: use of deleted function 'std::unique_ptr<_Tp, _Dp>::unique_ptr(const std::unique_ptr<_Tp, _Dp>&) [with _Tp = Connection; _Dp = std::default_delete<Connection>]'
/usr/include/c++/13/bits/unique_ptr.h:522:7: note: declared here
  522 |       unique_ptr(const unique_ptr&) = delete;
```
**Underlying Cause:** Passing `conn` to a by-value parameter means copy-constructing the parameter from `conn`, and `unique_ptr`'s copy constructor is declared `= delete` (Chapter 4's table: declaring a move constructor deletes the copy). That is the type doing its job: if the copy compiled, `pool` and `conn` would both delete the same `Connection`. Java developers read `register_connection(conn, pool)` as "pass a reference" and expect to keep using `conn` afterwards; in C++ a by-value `unique_ptr` parameter is a contract that says "give it to me".

**Fix:**
```cpp
void ping(const Connection& c) { std::cout << "ping " << c.id << '\n'; }   // borrow, no ownership

ping(*conn);                                   // use it while we own it
register_connection(std::move(conn), pool);   // hand it over: conn is now null
```
Decide which of the two you meant. To keep using the object, pass `*conn` or `conn.get()` to a function that takes a reference or raw pointer. To hand it over, write `std::move(conn)` and do not touch `conn` afterwards except to assign or reset it.

### Pitfall 2: Two `shared_ptr`s from one raw pointer
**Buggy Snippet:**
```cpp
Session* raw = new Session{7};
std::shared_ptr<Session> a(raw);   // control block #1: strong = 1
std::shared_ptr<Session> b(raw);   // control block #2: strong = 1, same object
std::cout << "a.use_count() = " << a.use_count() << ", b.use_count() = " << b.use_count() << '\n';
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug && ./p2_bug      # no warning
a.use_count() = 1, b.use_count() = 1
~Session(7)
~Session(7)
free(): double free detected in tcache 2
Aborted (core dumped)

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p2_bug.cpp -o p2_asan && ./p2_asan
==2979==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010 ...
    #0 ... in Session::~Session() p2_bug.cpp:9
```
**Underlying Cause:** A control block is created by the `shared_ptr` *constructor that receives a raw pointer*, and a raw pointer carries no link back to any block. Two constructions from the same address therefore create two independent blocks, each with strong count one, each convinced it is the sole owner. When `b` dies its block deletes the `Session`; when `a` dies its block deletes the same bytes again, which is the `~Session` running twice on freed memory that ASan reports, followed by glibc's double-free abort. The counts printed as `1, 1` were the tell.

**Fix:**
```cpp
std::shared_ptr<Session> a = std::make_shared<Session>(7);   // the raw pointer never escapes
std::shared_ptr<Session> b = a;                              // copy: same block, strong = 2
```
Never construct a `shared_ptr` from a raw pointer that anything else might also own. Create with `make_shared`, share by copying the `shared_ptr`, and when a class needs to hand out `shared_ptr`s to itself, use `std::enable_shared_from_this`.

### Pitfall 3: A cycle of `shared_ptr`s
**Buggy Snippet:**
```cpp
struct Node {
    std::shared_ptr<Node> next;   // owns the other node ...
    ~Node() { std::cout << "~Node\n"; }
};

auto a = std::make_shared<Node>();
auto b = std::make_shared<Node>();
a->next = b;                  // a owns b   (b strong = 2)
b->next = a;                  // b owns a   (a strong = 2)
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p3_bug.cpp -o p3_bug && ./p3_bug
a strong = 2, b strong = 2
==2993==ERROR: LeakSanitizer: detected memory leaks
Indirect leak of 32 byte(s) in 1 object(s) allocated from:
    #1 ... in std::__new_allocator<std::_Sp_counted_ptr_inplace<Node, ...> >::allocate(...)
Indirect leak of 32 byte(s) in 1 object(s) allocated from:
    ...
```
No `~Node` line is ever printed.

**Underlying Cause:** Diagram 4, left. When `main` returns, the locals `a` and `b` are destroyed and each decrements one strong count, from 2 to 1. The remaining owner of each `Node` is the *other* `Node`'s `next` member, which will release it only when that `Node` is destroyed, which will happen only when its own count reaches zero, which requires the first `Node` to be destroyed. Neither destructor ever runs, and the two 32-byte blocks (`make_shared` puts the `Node` inside the control block) are unreachable but never freed. LeakSanitizer, which *does* trace reachability at exit like a garbage collector, is the tool that finds it.

**Fix:**
```cpp
struct Node {
    std::shared_ptr<Node> next;   // forward: ownership
    std::weak_ptr<Node> prev;     // backward: observation only, no count
    ~Node() { std::cout << "~Node\n"; }
};
a->next = b;                  // b strong = 2
b->prev = a;                  // a strong stays 1; a weak = 1
```
Decide the direction of ownership, and make every edge in the other direction weak (or a raw non-owning pointer when the lifetime is guaranteed by construction, as for a child whose parent always outlives it).

### Pitfall 4: `unique_ptr<T>` holding a `new[]` array
**Buggy Snippet:**
```cpp
std::unique_ptr<int> samples(new int[8]{});   // new[] ... but the deleter will call delete
samples.get()[3] = 42;
std::cout << "samples[3] = " << samples.get()[3] << '\n';
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug && ./p4_bug     # compiles and "works"
samples[3] = 42

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p4_bug.cpp -o p4_asan && ./p4_asan
==3015==ERROR: AddressSanitizer: alloc-dealloc-mismatch (operator new [] vs operator delete) on 0x503000000040
allocated by thread T0 here:
    #1 ... in main p4_bug.cpp:9
```
**Underlying Cause:** `std::default_delete<int>` calls `delete p`; the memory came from `new int[8]`, which must be released with `delete[]`. For `int` the two happen to behave the same in glibc's allocator, so the plain build shows nothing, but the standard makes the mismatch undefined behavior, and for a type with a destructor `delete` would run *one* destructor instead of eight and would pass the allocator the wrong address (the array form stores its element count in front of the block). The `.get()[3]` was the hint that the type was wrong: `unique_ptr<T>` does not offer indexing because it is not supposed to hold an array.

**Fix:**
```cpp
std::unique_ptr<int[]> samples = std::make_unique<int[]>(8);   // value-initialized, delete[] on destruction
samples[3] = 42;

std::vector<int> better(8);   // usually the right answer: it also knows its size
```
`unique_ptr<T[]>` exists for interoperating with APIs that hand you arrays; for anything you allocate yourself, `std::vector` (Chapter 8) owns the array, knows its length, and grows.

## 5. Summary and Self-Assessment

### Core Takeaways
- Ownership is a property of the type, not of the programmer's memory: `T*`/`T&` borrow, `unique_ptr` owns alone, `shared_ptr` owns jointly, `weak_ptr` observes. Application code creates objects with `make_unique`/`make_shared` and never spells `new` or `delete`.
- `std::unique_ptr` is one pointer, moves by copying and nulling, cannot be copied, and its `delete` path compiles to the same instructions as a raw `delete`; a stateless custom deleter costs nothing and turns any C-style handle into an RAII object. `unique_ptr<T[]>` is the array form; mixing the forms is undefined behavior.
- `std::shared_ptr` is two pointers plus a heap control block holding a strong count, a weak count, and a type-erased deleter, updated atomically. `make_shared` puts the object inside the block (one allocation, two with `new`), which also means the object's bytes outlive it while any `weak_ptr` remains. `weak_ptr::lock()` is the only safe way to reach an object you do not own.
- Reference counting cannot free cycles: ownership must form a tree, with every upward or sideways edge a `weak_ptr` or raw pointer. In exchange, destruction is deterministic and applies to every resource, not just memory, which is why C++ needs neither a collector nor a `try-with-resources`.

### Guided Challenges
1. **Measure the atomic cost.** Write two functions, one that copies and destroys a `std::shared_ptr<int>` a million times in a loop and one that does the same with `std::unique_ptr<int>` by `std::move`-ing back and forth, compile at `-O2`, and find the `lock xadd` (or `lock add`) instructions in `objdump -d` for the first and their absence in the second. Then link with `-static` versus without and count the `lock` prefixes again.
   **Hint:** libstdc++ checks at run time whether the process is still single-threaded (glibc's `__libc_single_threaded`, older builds `__gthread_active_p()`) and takes a plain add instead of the atomic one when it is, which is why the `lock` instruction is there but guarded by a branch.
2. **Find the hidden owner.** Build a small event system: a `Button` holds `std::vector<std::function<void()>>` callbacks, and a `Dialog` that owns the `Button` (via `std::shared_ptr`) registers a lambda that captures `shared_from_this()` so it can call `dialog->close()`. Run it under `-fsanitize=address` and explain the leak report using Diagram 4; then fix it by capturing a `std::weak_ptr` and locking inside the lambda, and show with `use_count()` that the `Dialog`'s count no longer changes when the callback is registered.
   **Hint:** a captured `shared_ptr` is an owning edge that lives inside an object the pointee itself owns; draw the graph and look for the cycle.
