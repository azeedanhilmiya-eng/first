# Chapter 4: Object Lifecycle and Class Invariants

> Series: C++: From Beginner to Advanced: Beneath the Abstraction
> Standard: C++20 (`-std=c++20`) · Toolchain used for every output below: g++ 13.3 on x86-64 Linux

## 1. Motivation and Mental Model

### Core Problem
A C++ object is born and dies at points fixed by the program text rather than by a garbage collector, so a class must state, through its constructor, destructor, and copy and move members, exactly what it owns and what happens to that ownership every time the object is created, copied, moved, or destroyed.

### Analogy / Python-Java Contrast
Think of a hotel with a strict front desk. When you check in (the **Constructor (构造函数)** runs) you receive a key, and the room is yours; when you walk out of the building for good (the **Destructor (析构函数)** runs) the key is taken back at the door whether you leave calmly, run out because of a fire alarm, or are carried out. Nobody has to remember to return it. If a friend copies your key (copying the object), the hotel must decide whether that means a second room with the same furniture (a deep copy) or two people holding keys to one room, in which case the second person to leave finds it already emptied (a double `delete`). Moving out to a bigger room (a move) means the furniture goes with you and your old room is left empty but tidy.

Java has no front desk. `new Account()` puts the object on the heap and it dies whenever the garbage collector decides; `finalize` is unreliable and deprecated, and cleanup of files or sockets needs `try-with-resources`, an explicit construct that only works for objects you remember to wrap. Copying is never automatic: `b = a` copies a reference, and a real copy needs `clone()` or a copy constructor by convention. Python is closer than Java: CPython's reference counting usually calls `__del__` the instant the last reference disappears, which is why `with open(...)` and `__exit__` exist, but the language does not promise it, reference cycles defeat it, and `b = a` still shares one object.

C++ makes all of it deterministic and all of it the class author's job. An object lives in a fixed number of bytes at a fixed place (Chapter 3); its lifetime begins when its constructor finishes and ends when its destructor starts; `b = a` runs the code *you* wrote for copying; and every resource the object holds, whether heap memory, a file, a lock, or a socket, is released by the destructor at the closing brace with no keyword at all. This chapter is about the machinery that makes the guarantee work, and the three or five functions that a class must get right for it to hold.

## 2. Deep Dive and Low-Level Mechanics

### 2.1 An object is bytes plus a promise

To the compiler a **Class (类)** is a layout plus a set of functions that operate on it. The layout part is exactly what Chapter 3 described for a **Struct (结构体)**: members are placed in declaration order with padding, and `sizeof` is the total. `struct` and `class` are the same construct; the only difference is the default **Access Specifier (访问说明符)**: members of a `struct` are `public` unless stated, members of a `class` are `private`. The example proves it: `PointS` and `PointC` have the same size, the same `offsetof`, and both are **Standard-Layout Types (标准布局类型)**.

```text
Diagram 1 — the example's own::Buffer as bytes (x86-64, libstdc++ 13): sizeof == 48

  a Buffer object on the stack                                  the heap
  ┌──────────────────────────────────────────────────────┐
  │ name_   std::string           32 bytes   offset  0   │      ┌────┬────┬────┬────┐
  │         (pointer, size, 16-byte local buffer)        │      │ 42 │  0 │  0 │  0 │ new int[4]
  ├──────────────────────────────────────────────────────┤      └────┴────┴────┴────┘
  │ size_   std::size_t = 4        8 bytes   offset 32   │        ▲  16 bytes
  ├──────────────────────────────────────────────────────┤        │
  │ data_   int*                   8 bytes   offset 40   │────────┘
  └──────────────────────────────────────────────────────┘
  The invariant: data_ == nullptr && size_ == 0,  OR  data_ points at exactly size_ ints we own.
```

The promise part is the **Class Invariant (类不变量)**: a statement about the members that is true whenever an outside observer can see the object. For `Buffer` it is written in the header: either the object is empty, or `data_` points at exactly `size_` ints that this object alone will `delete[]`. Every public function may assume the invariant on entry and must restore it before returning. The constructor's job is to *establish* it, which is why a constructor that cannot (a negative balance, a size too large) throws instead of returning: an object whose constructor throws never existed, and no destructor will run for it. The example's `Account("bob", -1)` shows exactly that.

The private members enforce the promise mechanically: nobody outside the class can set `size_` without `data_`, so nobody can break it. That is what `private` is for. It is not a security feature; it is the boundary of the invariant.

### 2.2 Construction, step by step

Writing `own::Buffer a("a", 4);` makes the compiler do three things in order:

1. **Reserve storage.** For an automatic object that is 48 bytes at some `rbp-N` in the current frame (Chapter 3); for `new Buffer(...)` it is a call to `operator new(48)`. The storage is raw; there is no object yet.
2. **Call the constructor with `this` pointing at the storage.** A constructor is an ordinary function whose hidden first parameter, `this`, arrives in `%rdi`. `nm -C buffer.o` shows it as a plain symbol, and shows something else: g++ emits every constructor and destructor twice.

```text
$ g++ -std=c++20 -c buffer.cpp && nm buffer.o | grep -E 'BufferC[12]E|BufferD[12]E'
0000000000000000 T _ZN3own6BufferC1ENSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEEEm
0000000000000000 T _ZN3own6BufferC2ENSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEEEm
0000000000000480 T _ZN3own6BufferC1EOS0_        (C1/C2 of Buffer(Buffer&&))
0000000000000480 T _ZN3own6BufferC2EOS0_
00000000000002b0 T _ZN3own6BufferC1ERKS0_       (C1/C2 of Buffer(const Buffer&))
00000000000002b0 T _ZN3own6BufferC2ERKS0_
0000000000000204 T _ZN3own6BufferD1Ev           (D1/D2 of ~Buffer())
0000000000000204 T _ZN3own6BufferD2Ev
```

`C1` is the *complete-object* constructor and `C2` the *base-object* constructor (Chapter 5 explains why inheritance needs two); for a class without virtual bases they are the same code, so both names point at the same offset. `D1`/`D2` are the matching destructors.

3. **Inside the constructor, members are constructed in declaration order**, using the **Member Initializer List (成员初始化列表)**, and only *then* does the body run.

```text
Diagram 2 — what happens inside  Account::Account(std::string owner, long cents)
             : owner_(std::move(owner)), balance_cents_(cents), id_(next_id_++) { if (...) throw ...; }

  time ─────────────────────────────────────────────────────────────────────────────────────▶
  ┌───────────────┬──────────────────────┬─────────────────────┬─────────────────┬──────────────┐
  │ storage       │ owner_ constructed   │ balance_cents_ = 5  │ id_ = 1         │ body runs    │
  │ reserved      │ (std::string move)   │ (plain store)       │ (const: NOW or  │ if (cents<0) │
  │ (no object)   │                      │                     │  never)         │   throw       │
  └───────────────┴──────────────────────┴─────────────────────┴─────────────────┴──────────────┘
                  ◀────────── order = DECLARATION order of the members, not list order ──────────▶
                                                                                    ▲
  if the body throws here: owner_, balance_cents_, id_ are destroyed in reverse, ───┘
  the storage is released, and the caller never receives an Account.
```

Two rules follow, and both are enforced by the compiler:

- **The list order is ignored; declaration order rules.** If an initializer reads a member declared *later*, it reads garbage. g++ warns with `-Wreorder` and `-Wuninitialized` (Pitfall 2).
- **A member not mentioned in the list is default-initialized**, which for `int`, pointers and other fundamental types means *left with whatever bytes were there*. "Initializing" such a member in the constructor body is really *assignment* to an already-existing object; for a `const` member or a reference member there is no such second chance, so the body is too late and the program does not compile (Pitfall 4). For a class-type member it means one default construction followed by one assignment instead of one direct construction: correct, but double the work.

Default member initializers (`std::size_t size_ = 0;` in the header) are the fallback used when the list says nothing, which is how `Buffer`'s two owning members are guaranteed to start empty.

### 2.3 Destruction, and when it happens

A destructor is also just a function taking `this`; what makes it special is *who calls it*: the compiler, at points it computes from the program text. The body runs first, then the members are destroyed in reverse declaration order, then any base subobjects (Chapter 5). The points are:

| Object | Destroyed when | In the example |
|--------|----------------|----------------|
| automatic (a local) | control leaves the enclosing block, by any route: `}`, `return`, `break`, `throw` | every `Tracer`, `- inner-2` before `- inner-1` |
| member | as part of its enclosing object's destruction, reverse declaration order | `member b` before `member a` |
| temporary | at the end of the full expression that created it | the `Buffer temporary` inside `operator=` |
| heap object | when `delete` (or a smart pointer, Chapter 6) says so, never automatically | `delete[] data_` inside `~Buffer` |
| static / global | at program exit, reverse order of construction | `std::cout` |

The route that surprises Java developers is `throw`. When an **Exception (异常)** propagates out of a function, the runtime performs **Stack Unwinding (栈展开)**: it walks back up the call stack frame by frame and, for each frame, calls the destructors of every automatic object that had been fully constructed, in reverse order. No `finally` is needed, because every object *is* its own `finally`.

### 2.4 RAII: the destructor is the only reliable place to clean up

**RAII (Resource Acquisition Is Initialization) (资源获取即初始化)** is the name of the pattern that turns the destructor rule into a resource-management strategy: acquire a resource in a constructor, release it in the destructor, and let scope do the bookkeeping. `ScopedFlag` in the example is the smallest possible RAII type: its constructor raises a flag and its destructor lowers it. `risky_operation` never mentions the flag on the way out, yet the flag is lowered on the normal return *and* while the `runtime_error` is flying past.

```text
Diagram 3 — two exits from risky_operation(busy, fail); the destructor runs on both

   normal path (fail == false)                    exceptional path (fail == true)
   ┌─────────────────────────────┐                ┌─────────────────────────────┐
   │ ScopedFlag guard(busy);     │ ctor: busy=1   │ ScopedFlag guard(busy);     │ ctor: busy=1
   │ if (fail) throw ...;        │ (not taken)    │ if (fail) throw ...;        │ ── throw ──┐
   │ cout << "work finished";    │                │ cout << "work finished";    │ (skipped)  │
   │ }                           │ dtor: busy=0   │ }                           │ ◀──────────┘ unwinding:
   └─────────────────────────────┘                └─────────────────────────────┘   dtor: busy=0
              │ return                                          │ keep unwinding to the catch in show_raii
              ▼                                                 ▼
   busy after normal return: false                   caught "disk on fire"; busy after exception: false
```

Every owning type in the standard library is RAII: `std::string` and `std::vector` release their heap block, `std::fstream` closes its file, `std::lock_guard` unlocks its mutex (Chapter 9), `std::unique_ptr` deletes its pointee (Chapter 6). The consequence for you as a class author is the subject of the next three sections: if your class holds a resource *directly* (a raw pointer from `new`, a file descriptor, a handle), the compiler-generated copy and move members are wrong, and you must write them. If it holds resources only through members that are themselves RAII types, you need write nothing.

### 2.5 Copying: what the compiler generates, and why it is wrong for owners

If you write no copy constructor, the compiler writes one: it copies each member, in order, with that member's own copy constructor. For `std::string` that is a deep copy (the string copies its heap block). For a raw `int*` it copies *the pointer*, eight bytes, and now two objects believe they own one array. This is a **Shallow Copy (浅拷贝)**, and for an owning class it is a bug: the second destructor to run deletes memory that was already freed.

```text
Diagram 4 — shallow (compiler-generated) versus deep (hand-written) copy of an owning object

  SHALLOW: IntArray b = a;  (Pitfall 1)                DEEP: own::Buffer b = a;  (the example)
      a                    b                                a                    b
  ┌─────────┐         ┌─────────┐                      ┌─────────┐         ┌─────────┐
  │ size_ 4 │         │ size_ 4 │                      │ size_ 4 │         │ size_ 4 │
  │ data_ ──┼────┬────┼── data_ │                      │ data_ ──┼──┐   ┌──┼── data_ │
  └─────────┘    │    └─────────┘                      └─────────┘  │   │  └─────────┘
                 ▼                                                  ▼   ▼
          ┌────┬────┬────┬────┐                       ┌────┬────┬────┬────┐ ┌────┬────┬────┬────┐
          │ 42 │  0 │  0 │  0 │  one array,           │ 42 │  0 │  0 │  0 │ │ 42 │  0 │  0 │  0 │
          └────┴────┴────┴────┘  two owners           └────┴────┴────┴────┘ └────┴────┴────┴────┘
   ~b: delete[] → freed.  ~a: delete[] AGAIN → abort   ~b frees the right one, ~a frees the left one
```

`Buffer`'s **Copy Constructor (拷贝构造函数)** performs the **Deep Copy (深拷贝)**: allocate a new array, copy the *contents*. Its **Copy Assignment Operator (拷贝赋值运算符)** has a harder job, because `*this` already owns something: it must release the old array, but only after the new one has been successfully made, or an exception halfway would leave `*this` broken. The idiom in the example, *copy-and-swap*, does it in two lines: build a temporary copy (may throw; `*this` is untouched), then `swap` the three members, so the temporary walks off with the old array and destroys it. Because `swap` exchanges only 48 bytes, no element is copied twice.

This is the **Rule of Three (三法则)**: a class that needs any one of destructor, copy constructor, copy assignment almost certainly needs all three, because needing one means the class owns something the compiler does not understand.

### 2.6 Moving: stealing instead of copying

Copying a `Buffer` costs an allocation and a `memcpy`. But when the source is about to die anyway, a temporary or a local being returned, that work is wasted: the destination could simply *take* the array. C++11 added the mechanism. An **Rvalue Reference (右值引用)** parameter, `Buffer&&`, binds only to rvalues (Chapter 2: temporaries and `std::move(x)`), so a class can provide a **Move Constructor (移动构造函数)** and **Move Assignment Operator (移动赋值运算符)** that the compiler selects precisely when the source is expendable.

```text
Diagram 5 — own::Buffer c = std::move(a);  three pointer-sized stores, zero bytes of data copied

   before                                     after
      a                    c                     a  (moved-from)          c
  ┌─────────┐         ┌ ─ ─ ─ ─ ┐            ┌─────────┐         ┌─────────┐
  │ name_ a │         │ (raw    │            │ "(moved │         │ name_ a │
  │ size_ 4 │         │ storage)│            │ -from)" │         │ size_ 4 │
  │ data_ ──┼──┐      └ ─ ─ ─ ─ ┘            │ size_ 0 │         │ data_ ──┼──┐
  └─────────┘  │                             │ data_ ∅ │         └─────────┘  │
               ▼                             └─────────┘                      ▼
       ┌────┬────┬────┬────┐                                          ┌────┬────┬────┬────┐
       │ 42 │  0 │  0 │  0 │  ◀── the same 16 bytes, not touched ──▶  │ 42 │  0 │  0 │  0 │
       └────┴────┴────┴────┘                                          └────┴────┴────┴────┘
   a's invariant is restored to "empty": its destructor will run (delete[] nullptr is a no-op)
```

Three details of the example's move members matter:

- **The source must be left valid.** `a` will still be destroyed, so it must satisfy the invariant: `size_ = 0`, `data_ = nullptr`. The standard's phrase is *valid but unspecified state*; for your own classes, make it a specified, empty one. The example prints `a.size() = 0` after the move.
- **`noexcept` is not decoration.** `std::vector` must relocate its elements when it grows. If the move constructor might throw, a failure halfway would leave some elements moved and some not, with no way back, so `vector` refuses and *copies* instead unless the move is declared `noexcept`. Pitfall 3 shows the difference in the logs: `copy a (1 KiB duplicated)` versus `move a (pointer stolen)`.
- **`std::move` moves nothing.** It is a cast to `Buffer&&` (Chapter 2 showed it compiles to a register copy). The move happens inside the constructor that the cast made eligible, and only if such a constructor exists; otherwise the copy constructor is silently chosen.

With move members a class follows the **Rule of Five (五法则)**: destructor, copy constructor, copy assignment, move constructor, move assignment. The example's `Buffer` is the complete set.

### 2.7 The Rule of Zero, and what the compiler will and will not generate

Almost no application class should follow the Rule of Five, because almost no application class should own a raw resource. Own it through a member that already does the five correctly, `std::string`, `std::vector`, `std::unique_ptr`, and the compiler-generated members become right *because they call the members' members*. That is the **Rule of Zero (零法则)**, and the example's `Record` is the demonstration: a `std::string` and a `std::vector<int>`, no special members written, and it copies deeply and moves cheaply (the output shows `r1` empty after the move). `sizeof(Record)` is 56, the sum of its two members, and `static_assert(std::is_nothrow_move_constructible_v<Record>)` passes because both members' moves are `noexcept`.

When you do declare special members, the compiler's generation rules change, and they are worth memorizing because they are the source of many silent copies:

| You declare | Compiler still generates | Compiler does NOT generate |
|-------------|--------------------------|----------------------------|
| nothing | all five | |
| a destructor | copy constructor, copy assignment (deprecated, but generated) | move constructor, move assignment: every "move" becomes a copy |
| a copy constructor or copy assignment | destructor | the move members, and the other copy member is generated as before |
| a move constructor or move assignment | destructor | copy constructor and copy assignment are *deleted*: the type becomes move-only |
| `= default` / `= delete` explicitly | exactly what you said | |

The `Tracer` class in the example deletes its copy members on purpose: an object whose job is to announce its birth and death should not be duplicable. `= delete` makes the attempt a compile error instead of a surprise.

### 2.8 Copy elision: returning by value is free

Returning an object by value looks like it should copy or move it into the caller. Since C++17 it does not, for the common case. When the return expression is a prvalue (a temporary, `return own::Buffer(name, 2);`), the language *requires* that the object be constructed directly in the caller's storage: no copy, no move, and no copy or move constructor even needs to exist. This is guaranteed **Copy Elision (拷贝省略)**. When the return expression is a named local (`own::Buffer result(...); return result;`), elision is permitted but not required (*named return value optimization*, NRVO), and g++ performs it even at `-O0`. The example counts: two objects returned by value, `0 copies, 0 moves`.

The proof that the compiler is doing this, rather than the moves being cheap and silent, is to forbid it:

```text
$ g++ -std=c++20 -fno-elide-constructors main.cpp buffer.cpp -o main_noelide && ./main_noelide
...
== 5. Copy elision: returning by value does not copy ==
  construct "prvalue": new int[2] = 8 bytes on the heap
  construct "named": new int[3] = 12 bytes on the heap
  move      -> "named": stole the pointer to 12 bytes; source is now empty
  destroy   "(moved-from)": delete[] 0 bytes
  two objects returned by value: 0 copies, 1 moves
```

The prvalue case is still elided (the standard requires it); the named case now moves. Either way, no copy: returning by value is the right default, and the Chapter 3 habit of "return a pointer to avoid copying" has no basis in C++17.

### 2.9 Compile time versus run time

```text
Diagram 6 — where each decision of this chapter is made

  COMPILE TIME (g++ reading the class and each use)               RUN TIME (the CPU)
  ──────────────────────────────────────────────────────────      ──────────────────────────────────
  layout: member offsets, sizeof(Buffer) == 48                    (offsets are constants in the code)
  which special member each expression calls:                     one ordinary function call each,
    Buffer b = a;          → Buffer(const Buffer&)                 `this` in %rdi
    Buffer c = std::move(a)→ Buffer(Buffer&&)
    b = c;                 → operator=(const Buffer&)
  whether a member is elided (prvalue return: always)             no instruction at all
  the exact points where each destructor is called                a call inserted at every exit path,
  (block end, return, throw)                                       plus unwinding tables for throw
  the member initialization order (declaration order)             stores in that order
  whether copy/move members exist or are deleted                  (a deleted member is a compile error)
```

Nothing in the right column checks anything. The destructor is called at the point the compiler computed, whether or not the object still owns something sensible; the copy constructor copies what you told it to. Every pitfall below is a case where the left column's decision did not match the author's intention.

## 3. Complete, Production-Grade Code Example

Three files. `buffer.h`/`buffer.cpp` implement `own::Buffer`, a fixed-size heap array with all five special members written by hand and narrated. `main.cpp` walks through six experiments: scope-bound lifetimes, member construction order and a throwing constructor, RAII across an exception, the Rule of Five in action, copy elision counted, and the Rule of Zero with a struct-versus-class comparison.

**`examples/ch04/buffer.h`**
```cpp
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
```

**`examples/ch04/buffer.cpp`**
```cpp
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
```

**`examples/ch04/main.cpp`**
```cpp
// main.cpp -- Chapter 4: when objects are born, what they own, and when they die.
#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <type_traits>
#include <utility>
#include <vector>

#include "buffer.h"

namespace {

void heading(std::string_view text) { std::cout << "\n== " << text << " ==\n"; }

// A class whose only job is to announce its own construction and destruction.
class Tracer {
public:
    explicit Tracer(std::string label) : label_(std::move(label)) {
        std::cout << "  + " << label_ << " constructed\n";
    }
    ~Tracer() { std::cout << "  - " << label_ << " destroyed\n"; }
    Tracer(const Tracer&) = delete;             // announcing objects should not be copied
    Tracer& operator=(const Tracer&) = delete;

private:
    std::string label_;
};

// ---- 1. scope decides lifetime ----------------------------------------------
void show_scope() {
    heading("1. Automatic objects: constructed at the declaration, destroyed at the closing brace");
    Tracer outer("outer");
    {
        Tracer first("inner-1");
        Tracer second("inner-2");
        std::cout << "  (leaving the inner block)\n";
    }  // second, then first: reverse order of construction
    std::cout << "  (leaving show_scope)\n";
}  // outer

// ---- 2. members and the initializer list -------------------------------------
struct Pair {
    Tracer a{"member a"};  // declared first  -> constructed first, destroyed last
    Tracer b{"member b"};  // declared second -> constructed second, destroyed first
};

class Account {
public:
    // The initializer list is where members are CONSTRUCTED; the body runs afterwards.
    Account(std::string owner, long cents)
        : owner_(std::move(owner)), balance_cents_(cents), id_(next_id_++) {
        if (balance_cents_ < 0) throw std::invalid_argument("negative opening balance");
    }
    [[nodiscard]] const std::string& owner() const noexcept { return owner_; }
    [[nodiscard]] int id() const noexcept { return id_; }

private:
    static inline int next_id_ = 1;
    std::string owner_;
    long balance_cents_;
    const int id_;  // const members can ONLY be set in the initializer list
};

void show_members() {
    heading("2. Members: constructed in declaration order, destroyed in reverse");
    {
        Pair pair;
        std::cout << "  (pair is complete)\n";
    }
    const Account acct("ada", 1'000);
    std::cout << "  Account #" << acct.id() << " for " << acct.owner() << " built via initializer list\n";
    try {
        const Account bad("bob", -1);
    } catch (const std::invalid_argument& e) {
        std::cout << "  constructor threw: " << e.what() << " -> no object exists, no destructor runs\n";
    }
}

// ---- 3. RAII: cleanup that cannot be skipped ---------------------------------
class ScopedFlag {
public:
    explicit ScopedFlag(bool& flag) noexcept : flag_(flag) { flag_ = true; std::cout << "  flag raised\n"; }
    ~ScopedFlag() { flag_ = false; std::cout << "  flag lowered (destructor)\n"; }
    ScopedFlag(const ScopedFlag&) = delete;
    ScopedFlag& operator=(const ScopedFlag&) = delete;

private:
    bool& flag_;
};

void risky_operation(bool& busy, bool fail) {
    ScopedFlag guard(busy);  // acquire in the constructor ...
    if (fail) throw std::runtime_error("disk on fire");
    std::cout << "  work finished normally\n";
}  // ... release in the destructor, on EVERY exit path

void show_raii() {
    heading("3. RAII: the destructor runs on return AND during stack unwinding");
    bool busy = false;
    risky_operation(busy, false);
    std::cout << "  busy after normal return: " << std::boolalpha << busy << '\n';
    try {
        risky_operation(busy, true);
    } catch (const std::runtime_error& e) {
        std::cout << "  caught \"" << e.what() << "\"; busy after exception: " << busy << '\n';
    }
}

// ---- 4. the Rule of Five, observed -------------------------------------------
void show_rule_of_five() {
    heading("4. Rule of Five: copy duplicates bytes, move steals a pointer");
    std::cout << "  sizeof(Buffer) = " << sizeof(own::Buffer) << " (string 32 + size_t 8 + int* 8)\n";
    own::Buffer a("a", 4);
    a[0] = 42;
    own::Buffer b = a;                 // copy constructor
    b[0] = 7;
    std::cout << "  a[0] = " << a[0] << ", b[0] = " << b[0] << ": separate arrays\n";
    own::Buffer c = std::move(a);      // move constructor: a is now empty but valid
    std::cout << "  after move: c.size() = " << c.size() << ", a.size() = " << a.size()
              << ", a.name() = " << a.name() << '\n';
    b = c;                             // copy assignment (copy-and-swap)
    b = std::move(c);                  // move assignment
    std::cout << "  (leaving show_rule_of_five: three destructors, one of them on an empty object)\n";
}

// ---- 5. copy elision --------------------------------------------------------
own::Buffer make_prvalue(std::string name) {
    return own::Buffer(std::move(name), 2);  // C++17: constructed directly in the caller's slot
}

own::Buffer make_named(std::string name) {
    own::Buffer result(std::move(name), 3);  // a named local ...
    result[0] = 1;
    return result;                           // ... elided by g++ (NRVO); at worst a move
}

void show_elision() {
    heading("5. Copy elision: returning by value does not copy");
    const int copies_before = own::Buffer::copies;
    const int moves_before = own::Buffer::moves;
    const own::Buffer p = make_prvalue("prvalue");
    const own::Buffer n = make_named("named");
    std::cout << "  two objects returned by value: " << own::Buffer::copies - copies_before
              << " copies, " << own::Buffer::moves - moves_before << " moves\n";
}

// ---- 6. the Rule of Zero and struct versus class ---------------------------
struct Record {                 // owns resources only through members that own themselves
    std::string title;
    std::vector<int> values;
};                              // compiler-generated copy/move/destructor are all correct

struct PointS { int x; double y; };
class PointC { public: int x; double y; };

void show_rule_of_zero() {
    heading("6. Rule of Zero, and struct vs class");
    static_assert(std::is_nothrow_move_constructible_v<Record>);
    Record r1{"readings", {1, 2, 3}};
    Record r2 = r1;                         // deep copy: vector and string copy their heap blocks
    Record r3 = std::move(r1);              // move: r1's members are now empty
    std::cout << "  Record copied and moved with no user-written code: r2 has " << r2.values.size()
              << " values, r3 has " << r3.values.size() << ", r1 has " << r1.values.size() << '\n';
    std::cout << "  sizeof(Record) = " << sizeof(Record) << " (string 32 + vector 24)\n";
    std::cout << "  sizeof(PointS) = " << sizeof(PointS) << ", sizeof(PointC) = " << sizeof(PointC)
              << ", offsetof(y) = " << offsetof(PointS, y) << " in both: only the default access differs\n";
    std::cout << "  standard layout? PointS " << std::is_standard_layout_v<PointS> << ", PointC "
              << std::is_standard_layout_v<PointC> << ", Record " << std::is_standard_layout_v<Record> << '\n';
}

}  // namespace

int main() {
    std::cout << "Chapter 4 probe: g++ 13, x86-64 Linux";
    show_scope();
    show_members();
    show_raii();
    show_rule_of_five();
    show_elision();
    show_rule_of_zero();
    return 0;
}
```

**Build and run:**
```text
$ g++ -std=c++20 -Wall -Wextra main.cpp buffer.cpp -o main
$ ./main
```
**Terminal Output:**
```text
Chapter 4 probe: g++ 13, x86-64 Linux
== 1. Automatic objects: constructed at the declaration, destroyed at the closing brace ==
  + outer constructed
  + inner-1 constructed
  + inner-2 constructed
  (leaving the inner block)
  - inner-2 destroyed
  - inner-1 destroyed
  (leaving show_scope)
  - outer destroyed

== 2. Members: constructed in declaration order, destroyed in reverse ==
  + member a constructed
  + member b constructed
  (pair is complete)
  - member b destroyed
  - member a destroyed
  Account #1 for ada built via initializer list
  constructor threw: negative opening balance -> no object exists, no destructor runs

== 3. RAII: the destructor runs on return AND during stack unwinding ==
  flag raised
  work finished normally
  flag lowered (destructor)
  busy after normal return: false
  flag raised
  flag lowered (destructor)
  caught "disk on fire"; busy after exception: false

== 4. Rule of Five: copy duplicates bytes, move steals a pointer ==
  sizeof(Buffer) = 48 (string 32 + size_t 8 + int* 8)
  construct "a": new int[4] = 16 bytes on the heap
  copy      "a" -> "a-copy": allocated and copied 16 bytes
  a[0] = 42, b[0] = 7: separate arrays
  move      -> "a": stole the pointer to 16 bytes; source is now empty
  after move: c.size() = 4, a.size() = 0, a.name() = (moved-from)
  copy      "a" -> "a-copy": allocated and copied 16 bytes
  destroy   "a-copy": delete[] 16 bytes
  move-assign -> "a": released ours, stole theirs
  (leaving show_rule_of_five: three destructors, one of them on an empty object)
  destroy   "(moved-from)": delete[] 0 bytes
  destroy   "a": delete[] 16 bytes
  destroy   "(moved-from)": delete[] 0 bytes

== 5. Copy elision: returning by value does not copy ==
  construct "prvalue": new int[2] = 8 bytes on the heap
  construct "named": new int[3] = 12 bytes on the heap
  two objects returned by value: 0 copies, 0 moves
  destroy   "named": delete[] 12 bytes
  destroy   "prvalue": delete[] 8 bytes

== 6. Rule of Zero, and struct vs class ==
  Record copied and moved with no user-written code: r2 has 3 values, r3 has 3, r1 has 0
  sizeof(Record) = 56 (string 32 + vector 24)
  sizeof(PointS) = 16, sizeof(PointC) = 16, offsetof(y) = 8 in both: only the default access differs
  standard layout? PointS true, PointC true, Record true
```

Reading section 4 of the output against Diagram 4 and 5: the copy allocates and copies 16 bytes; the move copies nothing and leaves `a` empty; `b = c` runs the copy constructor on a temporary and then destroys the temporary, which is copy-and-swap disposing of `b`'s old array; and at the closing brace three destructors run in reverse order, two of them on moved-from objects that own nothing. Section 5's `0 copies, 0 moves` is copy elision; section 6's `r1 has 0` is `std::vector`'s own move constructor doing for `Record` what `Buffer` does by hand.

## 4. Pitfalls and Anti-Patterns

### Pitfall 1: A destructor without a copy constructor (the Rule of Three, broken)
**Buggy Snippet:**
```cpp
class IntArray {
public:
    explicit IntArray(std::size_t n) : size_(n), data_(new int[n]{}) {}
    ~IntArray() { delete[] data_; }
    // No copy constructor written: the compiler generates one that copies the POINTER.
private:
    std::size_t size_;
    int* data_;
};

int main() {
    IntArray a(4);
    IntArray b = a;   // shallow copy: b.data_ == a.data_
}   // b is destroyed: delete[] the array. Then a is destroyed: delete[] it AGAIN.
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug && ./p1_bug      # compiles without a warning
a and b both claim 4 ints
free(): double free detected in tcache 2
Aborted (core dumped)

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p1_bug.cpp -o p1_asan && ./p1_asan
==2568==ERROR: AddressSanitizer: attempting double-free on 0x502000000010 in thread T0:
    #1 ... in IntArray::~IntArray() p1_bug.cpp:10
freed by thread T0 here:
    #1 ... in IntArray::~IntArray() p1_bug.cpp:10
previously allocated by thread T0 here:
    #1 ... in IntArray::IntArray(unsigned long) p1_bug.cpp:9
```
**Underlying Cause:** The implicitly generated copy constructor is memberwise: eight bytes of `size_`, eight bytes of `data_`, done (Diagram 4, left). Both objects now hold the same heap address, and both destructors run at the closing brace, in reverse order. The first `delete[]` returns the block to glibc's allocator; the second hands it the same block again, which glibc's `tcache` detects and aborts on. Had the block been reused in between, the second `delete[]` would corrupt whatever now lives there and the crash would surface much later, somewhere unrelated. The destructor was the tell: a class that needs to *release* something in its destructor owns that thing, and owning things is exactly what the generated copy cannot handle.

**Fix:**
```cpp
class IntArray {
public:
    explicit IntArray(std::size_t n) : data_(n) {}   // std::vector allocates, copies, moves, frees
    [[nodiscard]] std::size_t size() const noexcept { return data_.size(); }
    // No destructor, no copy/move members: the generated ones call std::vector's, which are correct.
private:
    std::vector<int> data_;
};
```
The Rule of Zero. If the raw array were genuinely required (an API that hands you a pointer), write all five members as `own::Buffer` does, or wrap the pointer in `std::unique_ptr<int[]>` (Chapter 6), which is move-only and makes the shallow copy a compile error rather than a crash.

### Pitfall 2: Initializer-list order is not initialization order
**Buggy Snippet:**
```cpp
class Range {
public:
    // The list says lo_ then hi_, but members are constructed in DECLARATION order.
    explicit Range(int lo) : lo_(lo), hi_(lo_ + 10) {}
private:
    int hi_;   // declared first: constructed first, from a lo_ that does not exist yet
    int lo_;
};
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug
p2_bug.cpp: In constructor 'Range::Range(int)':
p2_bug.cpp:16:9: warning: 'Range::lo_' will be initialized after [-Wreorder]
p2_bug.cpp:15:9: warning:   'int Range::hi_' [-Wreorder]
p2_bug.cpp:10:14: warning:   when initialized here [-Wreorder]
p2_bug.cpp:10:43: warning: member 'Range::lo_' is used uninitialized [-Wuninitialized]
   10 |     explicit Range(int lo) : lo_(lo), hi_(lo_ + 10) {}
      |                                           ^~~
$ ./p2_bug
lo = 5, hi = 32775          # -O0: whatever bytes were in the frame, plus 10
$ g++ -std=c++20 -Wall -Wextra -O2 p2_bug.cpp -o p2_O2 && ./p2_O2
lo = 5, hi = 10             # -O2: the optimizer treated the uninitialized read as 0
```
**Underlying Cause:** Diagram 2: the compiler emits the member initializers in *declaration* order, because that is also the order in which the destructor will tear them down, and the two must mirror each other for exceptions to unwind correctly. So `hi_(lo_ + 10)` runs first and reads the four bytes of `lo_`'s slot before anything was stored there. Reading an uninitialized object is undefined behavior: at `-O0` you get the stale stack contents, at `-O2` g++ is free to assume the value is anything convenient and picks 0. Java initializes every field to a default before any constructor code runs; Python has no fields until you assign them. C++ gives you the bytes as they are.

**Fix:**
```cpp
class Range {
public:
    explicit Range(int lo) : lo_(lo), hi_(lo + 10) {}   // initialize from the parameter ...
private:
    int lo_;   // ... and declare in dependency order, matching the list
    int hi_;
};
```
Two habits make this class of bug impossible: initialize every member from constructor *parameters* rather than from other members, and keep the initializer list in declaration order so that `-Wreorder` stays silent and any deviation stands out.

### Pitfall 3: A move constructor that is not `noexcept`
**Buggy Snippet:**
```cpp
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

std::vector<Blob> blobs;
for (const char* tag : {"a", "b", "c"}) blobs.push_back(Blob(tag));   // grows: 1 -> 2 -> 4 elements
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug && ./p3_bug        # no diagnostic of any kind
push a:
  move a (pointer stolen)
push b:
  move b (pointer stolen)
  copy a (1 KiB duplicated)          <- relocation on growth: COPIED
push c:
  move c (pointer stolen)
  copy a (1 KiB duplicated)
  copy b (1 KiB duplicated)
```
**Underlying Cause:** When `std::vector` outgrows its block it allocates a bigger one and relocates every element (Chapter 8). It has two ways to relocate, move or copy, and it asks the type a question at compile time: `std::is_nothrow_move_constructible`. If the answer is no, moving element *k* could throw after elements 0..k-1 were already moved out of the old block, leaving the vector with no way to restore them; copying, by contrast, leaves the old block intact until the end and can simply be abandoned on failure. So `vector` chooses the safe, slow path: `std::move_if_noexcept` yields an lvalue, and the copy constructor runs. The move constructor is *correct*; it is merely unusable by the container that needs it most, and the only symptom is a program that is slower than it should be.

**Fix:**
```cpp
Blob(Blob&& other) noexcept   // a promise the container can rely on: relocation cannot fail halfway
    : tag_(std::move(other.tag_)), payload_(std::move(other.payload_)) {
    std::cout << "  move " << tag_ << " (pointer stolen)\n";
}
```
```text
push c:
  move c (pointer stolen)
  move a (pointer stolen)
  move b (pointer stolen)
```
Mark move constructors and move assignment operators `noexcept` (they steal pointers; they have no reason to throw), or better, follow the Rule of Zero: the compiler-generated move of a class made of `std::string`s is already `noexcept`.

### Pitfall 4: "Initializing" `const` and reference members in the constructor body
**Buggy Snippet:**
```cpp
class Greeting {
public:
    Greeting(const std::string& name, int times) {
        name_ = name;      // too late: name_ had to be bound before the body began
        times_ = times;    // too late: times_ is const and already exists
    }
private:
    const std::string& name_;
    const int times_;
};
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug
p4_bug.cpp: In constructor 'Greeting::Greeting(const std::string&, int)':
p4_bug.cpp:9:5: error: uninitialized reference member in 'const std::string&' [-fpermissive]
p4_bug.cpp:15:24: note: 'const std::string& Greeting::name_' should be initialized
p4_bug.cpp:9:5: error: uninitialized const member in 'const int' [-fpermissive]
p4_bug.cpp:16:15: note: 'const int Greeting::times_' should be initialized
p4_bug.cpp:10:17: error: no match for 'operator=' (operand types are 'const std::string' and 'const std::string')
...
p4_bug.cpp:11:16: error: assignment of read-only member 'Greeting::times_'
```
**Underlying Cause:** By the time the opening brace of the body is reached, every member has already been constructed (Diagram 2). For `name_` that would mean binding a reference to nothing, which the language forbids: hence *uninitialized reference member*. For `times_` it would mean a `const int` with no value, equally forbidden. The two statements in the body are then *assignments* to existing members, and a reference to `const` cannot be assigned through, a `const int` cannot be assigned at all. Java developers expect the constructor body to be where fields get their values, because in Java it is (final fields included, as long as they are assigned exactly once). In C++ the body is for work that needs fully built members; the values belong in the initializer list.

**Fix:**
```cpp
Greeting(const std::string& name, int times) : name_(name), times_(times) {}
```
And a caution that the type system does not enforce: a reference member makes the object's validity depend on an object it does not own. `Greeting` is safe only while `who` outlives it, which is why the fixed program declares `who` first. Prefer a `std::string` member (owning) unless the reference is deliberate.

## 5. Summary and Self-Assessment

### Core Takeaways
- An object is a fixed layout plus a class invariant. The constructor establishes the invariant (or throws, in which case no object and no destructor exist), members are constructed in declaration order via the initializer list before the body runs, and the destructor runs at a point the compiler computes: block end, `return`, `delete`, end of the full expression for temporaries, or during stack unwinding. `struct` and `class` differ only in default access.
- RAII turns that guarantee into resource management: acquire in the constructor, release in the destructor, and every exit path, including exceptions, cleans up with no keyword. Every standard owning type works this way, so a class made of them needs no special members at all (the Rule of Zero).
- A class that holds a raw resource must write all five special members (the Rule of Five), because the generated copy is memberwise and shallow: two owners, one resource, double free. Copy duplicates the resource; move steals the pointer and leaves the source empty and valid; copy-and-swap gives assignment the strong exception guarantee; `noexcept` on the move members is what lets `std::vector` use them.
- Returning by value is free: prvalue returns are elided by rule, named returns by NRVO; `std::move` is a cast that merely makes the move members eligible. Declaring a destructor silently suppresses move generation, so "moves" become copies; prefer `= default`/`= delete` to say what you mean.

### Guided Challenges
1. **Make the shallow copy visible.** Add a `static int live` counter to Pitfall 1's `IntArray` that the constructor increments and the destructor decrements, print it at the end of `main`, and then run the program under `-fsanitize=address` and read which line the report blames. Next, without changing to `std::vector`, write the copy constructor and copy assignment (use copy-and-swap) and confirm with the counter and with ASan that both objects now die cleanly. Finally add `IntArray(IntArray&&) noexcept` and count constructor calls when you `push_back` three `IntArray`s into a `std::vector`.
   **Hint:** copy-and-swap needs a `swap` that exchanges only `size_` and `data_`; if you find yourself copying elements inside `operator=`, you have written the copy constructor twice.
2. **Find the point of destruction.** Write a `Tracer`-like class and construct one as a temporary inside a longer expression, `std::cout << Tracer("temp").label() << " printed\n";`, then as a `const Tracer&` bound to a temporary (`const Tracer& t = Tracer("bound");`), then as an element of a `std::vector<Tracer>` that you `clear()`. Predict the exact position of each `destroyed` line in the output before running, and explain each with the table in section 2.3.
   **Hint:** a temporary dies at the end of the *full expression*, unless a reference is bound directly to it, in which case its lifetime is extended to the reference's scope; `clear()` destroys elements but `vector` keeps its block.
