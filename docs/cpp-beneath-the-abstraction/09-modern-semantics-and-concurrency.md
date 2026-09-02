# Chapter 9: Modern C++ Semantics and Concurrency

> Series: C++: From Beginner to Advanced: Beneath the Abstraction
> Standard: C++20 (`-std=c++20`) · Toolchain used for every output below: g++ 13.3 on x86-64 Linux

## 1. Motivation and Mental Model

### Core Problem
Modern C++ needs to say three things the machine can do cheaply but the original language could not express, "take this dying object's resources", "pass this argument through exactly as I received it", and "carry this code together with its state", and it needs to do so on hardware where several threads execute at once and see memory in an order the source code does not promise.

### Analogy / Python-Java Contrast
Moving house. A *copy* means buying a second set of every piece of furniture for the new address; a *move* means loading the furniture onto a truck and leaving the old rooms empty but intact. `std::move` is not the truck: it is the sticker on the door that says "this house may be emptied", and only a mover (a move constructor) does the emptying. *Forwarding* is a courier who hands a parcel on exactly as received, fragile sticker and all, without repacking it. A *lambda* is a lunchbox: the recipe and the ingredients it needs travel in one container, and the size of the box is exactly the size of what you packed. And *threads* are several cooks in one kitchen: the shared stove is fine until two of them turn the same knob at the same instant, which is why there is one knife (a mutex) that only one cook may hold, and a counter that clicks atomically no matter who presses it.

Python has no move and no need for one: every variable is a reference, `b = a` copies eight bytes, and objects die by reference count. Its closures capture variables by *cell*, so the lambda sees later changes, and its threads take turns under the global interpreter lock, so `++counter` from four threads is slow but usually right. Java is closer to C++ here: no move, but the JIT elides copies; lambdas capture *effectively final* variables by value, exactly like C++'s `[x]`; `synchronized`, `java.util.concurrent.atomic`, and the Java Memory Model are the direct ancestors of `std::mutex`, `std::atomic`, and C++'s memory model, and a data race in Java is a bug rather than undefined behavior.

C++ exposes all of it. A **Move Constructor (移动构造函数)** is code you can read that copies three pointers; a closure is a class whose `sizeof` you can print; a thread is an OS thread with its own 8 MiB stack and no interpreter lock; and a **Data Race (数据竞争)** is undefined behavior that the optimizer will cheerfully exploit. This chapter measures each mechanism and ends with the tool, ThreadSanitizer, that makes the invisible races visible.

## 2. Deep Dive and Low-Level Mechanics

### 2.1 Rvalue references: an overload for things that are about to die

Chapter 2 introduced value categories and Chapter 4 used them; here is the mechanism in full. An **Rvalue Reference (右值引用)**, spelled `T&&`, binds only to rvalues: temporaries (prvalues) and expressions marked expiring (xvalues). Because overload resolution prefers `T&&` over `const T&` for an rvalue, a function can have two versions, one that must leave its argument intact and one that may plunder it:

```text
Diagram 1 — which sink() the example's calls select (Chapter 2's ranking, applied)

  argument expression           category     const std::string&    std::string&&      chosen
  ───────────────────────────   ──────────   ───────────────────   ────────────────   ─────────────────
  name                          lvalue       viable                not viable         const&  (copied 5)
  std::string("tmp")            prvalue      viable                viable, better     &&      (would steal 3)
  std::move(name)               xvalue       viable                viable, better     &&      (would steal 5)
  s   inside  f(std::string&& s)  LVALUE     viable                not viable         const&  (!)
  std::forward / std::move(s)   xvalue       viable                viable, better     &&
```

The fourth row is the one that catches everyone. *A named rvalue reference is an lvalue*: inside `pass_named_rvalue_ref(std::string&& s)`, the expression `s` has a name and an address, so it is an lvalue, and `sink(s)` picks the copying overload. The example prints exactly that (`pass_named_rvalue_ref("bob") -> const&`), and the fix is to re-mark it with `std::move(s)`. The rule exists for safety: `s` could be used twice inside the function, and only the programmer knows which use is the last.

### 2.2 `std::move` moves nothing

`std::move(x)` is `static_cast<std::remove_reference_t<T>&&>(x)`: a cast that changes the value category of an expression and emits no instructions (Chapter 2 showed it compiling to a register copy). The example's `static_assert` checks its type. **Move Semantics (移动语义)** happen in whatever constructor or assignment the cast makes eligible: `std::string moved_to = std::move(name)` selects `std::string`'s move constructor, which copies the pointer, size, and capacity and leaves `name` empty. Two corollaries:

- If no move constructor exists, or the source is `const`, the cast selects the copy constructor and the program silently copies. `std::move` on a `const` object is the classic version of this.
- The moved-from object is in a *valid but unspecified state*: you may assign to it, destroy it, or call functions with no preconditions (`size()`, `clear()`), and nothing else. libstdc++ leaves a moved-from `std::string` empty (`name.size() = 0` in the output), but that is a library choice, not a guarantee.

### 2.3 Forwarding references and reference collapsing

A function template that takes `T&&` where `T` is *deduced* is a different animal: `T&&` there is a **Forwarding Reference (转发引用)**, and it binds to *anything*. The trick is in how `T` is deduced and how references combine, **Reference Collapsing (引用折叠)**:

```text
Diagram 2 — relay(T&& value) called two ways; std::forward<T> restores the original category

  call                      deduced T          T&&  (after collapsing)   std::forward<T>(value) yields   sink() chosen
  ────────────────────────  ─────────────────  ────────────────────────  ─────────────────────────────   ─────────────
  relay(s)   (lvalue)       std::string&       std::string& && → &       std::string&   (an lvalue)       const&
  relay(std::string("tmp")) std::string        std::string&&             std::string&&  (an xvalue)       &&

  collapsing rules (the only combinations that can arise):   & &  → &     & && → &     && & → &     && && → &&
  "an lvalue reference wins"; the example checks two of them with std::add_rvalue_reference_t and is_same_v
```

`std::forward<T>(value)` is `static_cast<T&&>(value)`: with `T = std::string&` that collapses to an lvalue cast (a no-op), with `T = std::string` it is an rvalue cast (the same thing `std::move` does). One template therefore passes lvalues on as lvalues and rvalues on as rvalues, which is **Perfect Forwarding (完美转发)**, the machinery under `std::make_unique`, `emplace_back`, and every factory function in the standard library. Note the asymmetry with section 2.1: `T&&` on a *deduced* `T` forwards; `std::string&&` on a concrete type is a plain rvalue reference.

### 2.4 Lambdas are classes the compiler writes for you

A **Lambda Expression (Lambda 表达式)** is syntax for defining a class and constructing one object of it. The class has an `operator()` with the lambda's body, one data member per **Capture (捕获)**, and a name only the compiler knows; the object is the **Closure (闭包)**. g++ will show you the class:

```text
$ g++ -std=c++20 -fdump-lang-class -c main.cpp && grep -A2 'Class.*show_lambdas()::<lambda(int)>' main.cpp.*.class
Class {anonymous}::show_lambdas()::<lambda(int)>      size=4  align=4      [n]      one int member
Class {anonymous}::show_lambdas()::<lambda(int)>      size=8  align=8      [&n]     one int* member
Class {anonymous}::show_lambdas()::<lambda(int)>      size=16 align=8      [n,&big] an int and a long* (padded)
Class {anonymous}::show_lambdas()::<lambda(int)>      size=1  align=1      []       empty class
```

```text
Diagram 3 — the closure objects of the example's section 3, and the hand-written equivalent

  auto by_value = [n](int x) { return x + n; };        struct HandWrittenAdder {          both: sizeof == 4
        ┌──────────┐                                     int n;                          both: operator()(int) const
        │ n = 10   │ (a COPY: n = 100 later is invisible)  int operator()(int x) const { return x + n; }
        └──────────┘                                   };
  auto by_ref = [&n](int x) { return x + n; };         ┌──────────┐
                                                       │ int* → n │  sizeof == 8; sees n = 100; dangles if n dies (Pitfall 3)
                                                       └──────────┘
  auto counter = [count = 0]() mutable { ... };        ┌──────────┐  init-capture: a member created from an expression;
                                                       │ count    │  `mutable` drops the const on operator()
                                                       └──────────┘
  auto nothing = [](int x) { return x * 2; };          (empty; 1 byte because objects need addresses)
                                                       converts to int(*)(int): a plain function pointer
```

Three consequences: a by-value capture is a member initialized at the point of definition, so later changes to the original are invisible (`by_value(1) = 11` after `n = 100`); a by-reference capture is a stored pointer, with every dangling risk of Chapter 3 (Pitfall 3); and because each lambda is its own type, passing one to a function template instantiates the template *for that closure type* and the call is inlined, which is why `std::sort` with a lambda comparator matches hand-written loops. `std::function` is the opposite tool: **Type Erasure (类型擦除)** behind a fixed 32-byte object that stores small closures inline and heap-allocates large ones, at the cost of an indirect call, for when the callable's type must not appear in an interface.

### 2.5 Threads, and what a data race is

A **Thread (线程)** in C++ is an operating-system thread: `std::thread` calls `pthread_create`, which calls `clone`, and the new thread gets its own 8 MiB stack (an anonymous mmap, Chapter 3) and its own registers, but shares the heap, the globals, and every object whose address it is handed. `std::jthread` (C++20) is `std::thread` whose destructor joins, so a scope becomes a lifetime, exactly as with every other RAII type; the example runs four workers in a `std::vector<std::jthread>` and the closing brace waits for all of them.

Shared memory without rules is the problem. `++counter` on a plain `long` is three steps, and two threads can interleave them:

```text
Diagram 4 — two threads execute ++counter (Pitfall 1); counter starts at 5

  thread A                        thread B                        counter in memory
  mov  (counter), %rax   → 5                                       5
                                  mov  (counter), %rcx   → 5       5
  add  $1, %rax          → 6                                       5
                                  add  $1, %rcx          → 6       5
  mov  %rax, (counter)                                             6
                                  mov  %rcx, (counter)             6   ← one increment lost
```

Two threads, one memory location, at least one write, and nothing that orders them: that is a data race, and the C++ standard makes it **Undefined Behavior (未定义行为)** outright. That is stronger than "you might lose an update": the optimizer assumes no other thread touches a non-atomic variable, so at `-O2` it hoists the load, runs the loop in a register, and stores once, turning `100000` increments into `addq $0x186a0,(%rax)`. Pitfall 1 shows all three faces: wrong totals at `-O0`, a "correct" total at `-O2` that merely hid the race, and ThreadSanitizer naming the two racing writes. (A **Race Condition (竞态条件)** is the broader, logical notion, an outcome that depends on timing; every data race is a race condition, but a race condition can exist with no undefined behavior, as in Pitfall 4's deadlock.)

### 2.6 Mutexes: one cook at a time

A **Mutex (互斥锁)** is a **Lock (锁)** that only one thread may hold; the code between lock and unlock is a **Critical Section (临界区)**. `std::mutex` wraps a `pthread_mutex_t`; an uncontended lock is a single atomic compare-and-swap in user space, and only a *contended* lock enters the kernel (`futex`) to put the thread to sleep, which is why a mutex is cheap when threads rarely collide and expensive when they always do. Never call `lock()`/`unlock()` by hand: `std::lock_guard` and `std::scoped_lock` are RAII wrappers that unlock at the closing brace, including on exceptions (the example's guarded loop). Two rules keep mutexes correct:

- **A mutex protects data, not code.** Every access to the shared data, reads included, must happen under the same mutex; a lock around the writer alone is still a data race for the reader.
- **Take multiple locks in one fixed order, or in one call.** Two threads that take mutexes A and B in opposite orders will eventually each hold one and wait for the other: a **Deadlock (死锁)** (Pitfall 4). `std::scoped_lock(a, b)` acquires any number of mutexes with a deadlock-avoiding algorithm (`std::lock`, which tries and backs off), regardless of argument order; the example takes `a, b` with it and shows, from a helper thread, that `a` is held inside the scope and free after it. (`std::mutex` is not recursive, and probing it from the thread that holds it is undefined; that is why the probe is another thread.)

### 2.7 Atomics: one instruction instead of a lock

An **Atomic Operation (原子操作)** is one that other threads observe as either not-yet-done or entirely done. `std::atomic<long>` is a `long` (`sizeof == 8`, `is_always_lock_free == true` on x86-64) whose operations compile to instructions the CPU guarantees atomic:

```text
$ g++ -std=c++20 -O2 -c atom.cpp && objdump -d -C --no-show-raw-insn atom.o
<bump_atomic(std::atomic<long>&)>:       c.fetch_add(1, std::memory_order_relaxed)
   lock addq $0x1,(%rdi)                 ; ONE instruction; `lock` makes the read-modify-write indivisible
<load_seq(std::atomic<long> const&)>:    c.load()            (seq_cst, the default)
   mov    (%rdi),%rax                    ; a plain load: x86 loads are already acquire
<store_seq(std::atomic<long>&, long)>:   c.store(v)          (seq_cst)
   xchg   %rsi,(%rdi)                    ; a locked exchange: the store must not be reordered with later loads
<bump_plain(long&)>:                     ++c                 (not atomic)
   addq   $0x1,(%rdi)                    ; same instruction WITHOUT `lock`: two cores can interleave it
<bump_locked(std::mutex&, long&)>:       lock_guard + ++c
   call   pthread_mutex_lock ; addq $0x1,0x0(%rbp) ; ... pthread_mutex_unlock
```

That `lock` prefix is the entire difference between the example's `atomic = 400000` and Pitfall 1's lost updates. The second thing an atomic controls is **Memory Order (内存序)**: how the compiler and the CPU may reorder *other* memory accesses around the atomic one. The default, `std::memory_order_seq_cst`, is the strong, simple choice: every thread agrees on one global order of all seq_cst operations, and no ordinary access moves across one. `memory_order_relaxed` promises atomicity and nothing else, which is enough for a pure counter (the example uses it for `fetch_add`) and wrong for anything that *publishes* data to another thread; `acquire`/`release` are the middle ground that makes "write the data, then set the flag" correct without a full fence. Use `seq_cst` until a measurement says otherwise; on x86, the cost difference shows up only on stores (`xchg` versus `mov`).

### 2.8 Compile time versus run time

```text
Diagram 5 — where each decision in this chapter is made

  COMPILE TIME (g++ reading the code)                              RUN TIME (the CPU, several at once)
  ─────────────────────────────────────────────────────────────    ──────────────────────────────────────────
  value category of every argument → which overload (const& / &&)  one ordinary call
  std::move / std::forward: casts, no code                          nothing
  T deduced for relay(); references collapsed                       nothing
  a lambda → a class with members for captures; sizeof fixed        an object on the stack; direct/inlined calls
  std::function<F> → a type-erased wrapper                          indirect call; maybe a heap block
  std::atomic ops → `lock` instructions per the memory order        indivisible read-modify-write; fences
  a plain shared ++ → load/add/store, freely hoisted (no race is      three steps, interleavable: lost updates,
    assumed to exist)                                                  or a hoisted loop that hides them
  lock_guard/scoped_lock → calls to pthread_mutex_lock/unlock       CAS in user space; futex syscall if contended
  std::jthread → pthread_create + join in the destructor            clone(); a new 8 MiB stack; scheduler decides
```

## 3. Complete, Production-Grade Code Example

One file. `main.cpp` shows overload selection by value category including the named-rvalue-reference trap, `std::move` as a cast, forwarding with reference collapsing verified by type traits, lambdas measured against a hand-written class, and four threads updating a mutex-guarded counter and an atomic counter with a helper thread probing the locks. Every thread is joined before anything is printed, so the output is identical on every run.

**`examples/ch09/main.cpp`**
```cpp
// main.cpp -- Chapter 9: what move, forward, lambdas, threads and atomics compile to.
#include <atomic>
#include <functional>
#include <iostream>
#include <mutex>
#include <string>
#include <string_view>
#include <thread>
#include <type_traits>
#include <utility>
#include <vector>

namespace {

void heading(std::string_view text) { std::cout << "\n== " << text << " ==\n"; }

// ---- 1. rvalue references and overload selection ------------------------------
std::string sink(const std::string& s) { return "const& (copied " + std::to_string(s.size()) + " chars)"; }
std::string sink(std::string&& s) { return "&& (would steal " + std::to_string(s.size()) + " chars)"; }

std::string pass_named_rvalue_ref(std::string&& s) { return sink(s); }              // s is an lvalue here!
std::string pass_with_move(std::string&& s) { return sink(std::move(s)); }           // restore the rvalue-ness

void show_rvalue_refs() {
    heading("1. T&& binds to rvalues; a NAMED T&& is an lvalue");
    std::string name = "alice";
    std::cout << "  sink(name)                     -> " << sink(name) << '\n';
    std::cout << "  sink(std::string(\"tmp\"))       -> " << sink(std::string("tmp")) << '\n';
    std::cout << "  sink(std::move(name))          -> " << sink(std::move(name)) << '\n';
    std::cout << "  pass_named_rvalue_ref(\"bob\")   -> " << pass_named_rvalue_ref("bob") << '\n';
    std::cout << "  pass_with_move(\"bob\")          -> " << pass_with_move("bob") << '\n';
    static_assert(std::is_same_v<decltype(std::move(name)), std::string&&>, "std::move is a cast");
    std::string moved_to = std::move(name);                  // now the string's buffer really moves
    std::cout << "  after std::string moved_to = std::move(name): moved_to = \"" << moved_to
              << "\", name.size() = " << name.size() << " (valid, unspecified: libstdc++ leaves it empty)\n";
}

// ---- 2. perfect forwarding ---------------------------------------------------------
template <typename T>
std::string relay(T&& value) {                               // T&& on a deduced T: a forwarding reference
    return sink(std::forward<T>(value));                     // lvalue in -> lvalue out; rvalue in -> rvalue out
}

void show_forwarding() {
    heading("2. Forwarding references and reference collapsing");
    std::string s = "carol";
    std::cout << "  relay(s)                 -> " << relay(s) << "   (T = std::string&,  T&& = std::string&)\n";
    std::cout << "  relay(std::string(\"tmp\")) -> " << relay(std::string("tmp")) << "  (T = std::string,   T&& = std::string&&)\n";
    std::cout << std::boolalpha;
    std::cout << "  collapsing: (int&)&& is int&: " << std::is_same_v<std::add_rvalue_reference_t<int&>, int&>
              << ", (int&&)&& is int&&: " << std::is_same_v<std::add_rvalue_reference_t<int&&>, int&&> << '\n';
}

// ---- 3. lambdas are classes ----------------------------------------------------------
struct HandWrittenAdder {                                    // what the compiler generates for [n](int x) { return x + n; }
    int n;
    int operator()(int x) const { return x + n; }
};

void show_lambdas() {
    heading("3. A lambda is an object of a compiler-written class");
    int n = 10;
    long big = 7;
    auto by_value = [n](int x) { return x + n; };            // copies n INTO the closure object
    auto by_ref = [&n](int x) { return x + n; };             // stores a pointer to n
    auto both = [n, &big](int x) { return x + n + static_cast<int>(big); };
    auto nothing = [](int x) { return x * 2; };              // no captures: an empty class
    auto counter = [count = 0]() mutable { return ++count; };   // init-capture; mutable: operator() is not const

    std::cout << "  sizeof: [] " << sizeof(nothing) << ", [n] " << sizeof(by_value) << ", [&n] " << sizeof(by_ref)
              << ", [n,&big] " << sizeof(both) << ", hand-written " << sizeof(HandWrittenAdder) << '\n';
    std::cout << "  is a class: " << std::is_class_v<decltype(by_value)> << ", operator() present: "
              << std::is_invocable_r_v<int, decltype(by_value), int> << '\n';
    n = 100;                                                 // the by-value copy does not see this
    std::cout << "  after n = 100: by_value(1) = " << by_value(1) << ", by_ref(1) = " << by_ref(1) << '\n';
    std::cout << "  mutable counter: " << counter() << ' ' << counter() << ' ' << counter() << '\n';
    int (*fn)(int) = nothing;                                // captureless lambdas convert to function pointers
    std::cout << "  captureless -> function pointer: fn(21) = " << fn(21) << '\n';
    std::function<int(int)> erased = both;                   // type-erased wrapper: costs a heap block or an indirection
    std::cout << "  sizeof(std::function<int(int)>) = " << sizeof(erased) << ", erased(1) = " << erased(1) << '\n';
}

// ---- 4. threads, mutexes, atomics ----------------------------------------------------
void show_threads() {
    heading("4. Threads: shared state needs a mutex or an atomic");
    constexpr int kThreads = 4;
    constexpr int kIterations = 100'000;

    long guarded = 0;
    std::mutex guarded_mutex;
    std::atomic<long> atomic_total{0};
    std::cout << "  std::atomic<long>::is_always_lock_free = " << std::atomic<long>::is_always_lock_free
              << ", sizeof " << sizeof(std::atomic<long>) << " (a plain long with special instructions)\n";
    {
        std::vector<std::jthread> workers;                   // jthread joins in its destructor
        for (int t = 0; t < kThreads; ++t) {
            workers.emplace_back([&] {
                for (int i = 0; i < kIterations; ++i) {
                    {
                        std::lock_guard<std::mutex> lock(guarded_mutex);   // RAII: unlocks on scope exit
                        ++guarded;
                    }
                    atomic_total.fetch_add(1, std::memory_order_relaxed);  // a single `lock add` instruction
                }
            });
        }
    }                                                        // all four joined here
    std::cout << "  " << kThreads << " threads x " << kIterations << " increments: mutex-guarded = " << guarded
              << ", atomic = " << atomic_total.load() << '\n';

    std::mutex a, b;                                         // two locks taken together, in one call
    // std::mutex is not recursive: only ANOTHER thread may legally probe it with try_lock.
    auto another_thread_can_lock = [&a] {
        bool got = false;
        {
            std::jthread probe([&] { got = a.try_lock(); if (got) a.unlock(); });
        }                                                    // joined here, BEFORE got is read
        return got;
    };
    {
        std::scoped_lock both(a, b);                         // deadlock-free ordering regardless of argument order
        std::cout << "  scoped_lock holds a and b; another thread's try_lock(a) succeeds: " << another_thread_can_lock() << '\n';
    }
    std::cout << "  after the scope: another thread's try_lock(a) succeeds: " << another_thread_can_lock() << '\n';
}

}  // namespace

int main() {
    std::cout << "Chapter 9 probe: g++ 13, x86-64 Linux";
    show_rvalue_refs();
    show_forwarding();
    show_lambdas();
    show_threads();
    return 0;
}
```

**Build and run:**
```text
$ g++ -std=c++20 -Wall -Wextra -pthread main.cpp -o main
$ ./main
```
**Terminal Output:**
```text
Chapter 9 probe: g++ 13, x86-64 Linux
== 1. T&& binds to rvalues; a NAMED T&& is an lvalue ==
  sink(name)                     -> const& (copied 5 chars)
  sink(std::string("tmp"))       -> && (would steal 3 chars)
  sink(std::move(name))          -> && (would steal 5 chars)
  pass_named_rvalue_ref("bob")   -> const& (copied 3 chars)
  pass_with_move("bob")          -> && (would steal 3 chars)
  after std::string moved_to = std::move(name): moved_to = "alice", name.size() = 0 (valid, unspecified: libstdc++ leaves it empty)

== 2. Forwarding references and reference collapsing ==
  relay(s)                 -> const& (copied 5 chars)   (T = std::string&,  T&& = std::string&)
  relay(std::string("tmp")) -> && (would steal 3 chars)  (T = std::string,   T&& = std::string&&)
  collapsing: (int&)&& is int&: true, (int&&)&& is int&&: true

== 3. A lambda is an object of a compiler-written class ==
  sizeof: [] 1, [n] 4, [&n] 8, [n,&big] 16, hand-written 4
  is a class: true, operator() present: true
  after n = 100: by_value(1) = 11, by_ref(1) = 101
  mutable counter: 1 2 3
  captureless -> function pointer: fn(21) = 42
  sizeof(std::function<int(int)>) = 32, erased(1) = 18

== 4. Threads: shared state needs a mutex or an atomic ==
  std::atomic<long>::is_always_lock_free = true, sizeof 8 (a plain long with special instructions)
  4 threads x 100000 increments: mutex-guarded = 400000, atomic = 400000
  scoped_lock holds a and b; another thread's try_lock(a) succeeds: false
  after the scope: another thread's try_lock(a) succeeds: true
```

Section 1's fourth and fifth lines are Diagram 1's trap and its cure; section 3's sizes are the class dump above; section 4's two `400000`s are Diagram 4 prevented twice over, once with a lock and once with a `lock` prefix.

## 4. Pitfalls and Anti-Patterns

### Pitfall 1: A shared counter with no synchronization
**Buggy Snippet:**
```cpp
long counter = 0;
{
    std::vector<std::jthread> workers;
    for (int t = 0; t < 4; ++t) {
        workers.emplace_back([&counter] {
            for (int i = 0; i < 100'000; ++i) ++counter;   // load, add, store: three steps, no lock
        });
    }
}
std::cout << "counter = " << counter << " (expected 400000)\n";
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra -O0 -pthread p1_bug.cpp -o p1_O0 && for i in 1 2 3; do ./p1_O0; done
counter = 145529 (expected 400000)          # representative: different every run
counter = 191780 (expected 400000)
counter = 132014 (expected 400000)

$ g++ -std=c++20 -Wall -Wextra -O2 -pthread p1_bug.cpp -o p1_O2 && ./p1_O2
counter = 400000 (expected 400000)          # "correct" -- the optimizer folded the loop:
$ objdump -d -C --no-show-raw-insn p1_O2 | grep -B1 186a0
   mov    0x8(%rdi),%rax
   addq   $0x186a0,(%rax)                   # 0x186a0 == 100000: one add per thread; the race window is one instruction

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=thread p1_bug.cpp -o p1_tsan && ./p1_tsan
WARNING: ThreadSanitizer: data race (pid=3774)
  Write of size 8 at 0x7ffed4ed2690 by thread T2:
    #0 operator() p1_bug.cpp:15
  Previous write of size 8 at 0x7ffed4ed2690 by thread T1:
    #0 operator() p1_bug.cpp:15
SUMMARY: ThreadSanitizer: data race p1_bug.cpp:15 in operator()
```
**Underlying Cause:** Diagram 4. At `-O0` each `++counter` is a load, an add, and a store, and four threads interleave them freely, so most increments overwrite each other and the total is whatever the timing produced. At `-O2` the program is *also* wrong, but differently: because a data race is undefined behavior, the compiler assumed no other thread touches `counter` during the loop, kept the running total in a register, and stored it once with a single `add`; the four adds still race, but a one-instruction window rarely loses. Java would have given the `-O0` behavior reliably (a lost-update bug, but a defined one); C++ gave two different wrong programs from one source. ThreadSanitizer instruments every memory access and reports the pair of unordered writes with both stacks.

**Fix:**
```cpp
std::atomic<long> counter{0};
...
for (int i = 0; i < 100'000; ++i) counter.fetch_add(1, std::memory_order_relaxed);   // `lock add`
```
Make the shared variable atomic (for a counter) or guard every access with one mutex (for anything larger than a word). Run the test suite under `-fsanitize=thread` at least once; races do not show up in review.

### Pitfall 2: A `std::thread` destroyed while still joinable
**Buggy Snippet:**
```cpp
void launch_report() {
    std::thread worker([] { std::cout << "report written\n"; });
    // forgot worker.join(): the std::thread object dies here while the thread may still run
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra -pthread p2_bug.cpp -o p2_bug && ./p2_bug
terminate called without an active exception
Aborted (core dumped)
```
**Underlying Cause:** `std::thread`'s destructor calls `std::terminate()` if the thread is still *joinable*, that is, if nobody has called `join()` (wait for it) or `detach()` (let it run unattended). The rule is deliberate: silently detaching would leave a thread running code whose locals, captured by reference, are about to be destroyed (Pitfall 3 on another thread), and silently joining would hide a blocking wait in a destructor. So the language makes forgetting a decision fatal and immediate rather than a rare crash later. Java threads simply keep running after the `Thread` object is unreachable; Python's `threading.Thread` is joined at interpreter exit unless `daemon=True`.

**Fix:**
```cpp
void launch_report() {
    std::jthread worker([] { std::cout << "report written\n"; });
}   // ~jthread: request_stop(), then join(): the function does not return until the thread is done
```
Use `std::jthread` (C++20) unless you specifically need `detach`, and then say so explicitly. A `std::jthread` also carries a `std::stop_token` so that a long-running worker can be asked to finish.

### Pitfall 3: A lambda that captures a local by reference and outlives it
**Buggy Snippet:**
```cpp
std::function<int()> make_counter(int start) {
    int count = start;                     // a local: lives in THIS frame
    return [&count] { return ++count; };   // the closure stores &count, i.e. an address in a dead frame
}

auto next = make_counter(10);              // make_counter's frame is gone
std::cout << next() << ' ' << next() << '\n';   // expected 11 12
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug && ./p3_bug           # no warning
Segmentation fault (core dumped)

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p3_bug.cpp -o p3_asan
$ ASAN_OPTIONS=detect_stack_use_after_return=1 ./p3_asan
==3817==ERROR: AddressSanitizer: stack-use-after-return on address 0x7f5e6c8000b0 ...
    #0 ... in operator() p3_bug.cpp:11
Address 0x7f5e6c8000b0 is located in stack of thread T0 at offset 48 in frame
    #0 ... in make_counter(int) p3_bug.cpp:9
```
**Underlying Cause:** Diagram 3, second row: `[&count]` makes the closure an object with one member, `int* `, pointing into `make_counter`'s stack frame. The closure is copied into the returned `std::function` and outlives the frame (Chapter 3, section 2.2), so every `++count` writes through a pointer into memory that now belongs to whatever function is running. Python's closures keep the variable alive in a heap cell precisely to make this pattern work; Java refuses to capture anything that is not effectively final, so it cannot arise. C++ lets you choose the capture mode and makes the wrong choice a dangling pointer.

**Fix:**
```cpp
std::function<int()> make_counter(int start) {
    return [count = start]() mutable { return ++count; };   // count lives inside the closure object
}
```
Capture by value (or init-capture) anything the closure may outlive; capture by reference only for lambdas that are called before the enclosing scope ends (a comparator passed to `std::sort`, the body of a `std::jthread` that is joined in the same scope). `[=]` and `[&]` defaults hide the decision; prefer naming the captures.

### Pitfall 4: Two mutexes taken in opposite orders
**Buggy Snippet:**
```cpp
void transfer() {
    std::lock_guard<std::mutex> a(accounts_mutex);   // holds accounts, then wants audit
    std::this_thread::yield();                       // let the other thread run: makes the bug reliable
    std::lock_guard<std::mutex> b(audit_mutex);
}
void audit() {
    std::lock_guard<std::mutex> b(audit_mutex);      // holds audit, then wants accounts
    std::this_thread::yield();
    std::lock_guard<std::mutex> a(accounts_mutex);
}
// main: run each once alone, then 10,000 rounds of { std::jthread t1(transfer); std::jthread t2(audit); }
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra -pthread p4_bug.cpp -o p4_bug && timeout 5 ./p4_bug | tail -2
transfer done
audit done
(no further output; the process hangs until `timeout` kills it: exit status 124)

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=thread p4_bug.cpp -o p4_tsan && timeout 10 ./p4_tsan
==================
WARNING: ThreadSanitizer: lock-order-inversion (potential deadlock) (pid=32187)
  Cycle in lock order graph: M0 (0x55a963f371a0) => M1 (0x55a963f371e0) => M0
  Mutex M1 acquired here while holding mutex M0 in main thread:
  Mutex M0 acquired here while holding mutex M1 in main thread:
SUMMARY: ThreadSanitizer: lock-order-inversion (potential deadlock) /usr/include/x86_64-linux-gnu/c++/13/bits/gthr-default.h:749 in __gthread_mutex_lock
==================
```
**Underlying Cause:** The transfer thread holds `accounts_mutex` and blocks on `audit_mutex`; the audit thread holds `audit_mutex` and blocks on `accounts_mutex`. Neither can proceed and neither will ever release what it holds, because release happens at a closing brace that will never be reached. Both threads sleep in the kernel on a `futex` forever, consuming no CPU, which is why the program looks idle rather than busy. It is a race condition without a data race: every access is correctly locked, and the bug is in the *order*. ThreadSanitizer builds a lock-order graph across the run and reports the cycle even on a run that happened not to hang.

**Fix:**
```cpp
void transfer() {
    std::scoped_lock both(accounts_mutex, audit_mutex);   // argument order does not matter
}
void audit() {
    std::scoped_lock both(audit_mutex, accounts_mutex);   // same two locks, opposite order: still safe
}
```
Acquire multiple locks in one `std::scoped_lock` call, which uses a try-and-back-off algorithm that cannot deadlock, or establish a global lock order and never violate it. Better still, design so that no code path needs two locks at once.

## 5. Summary and Self-Assessment

### Core Takeaways
- `T&&` on a concrete type binds only to rvalues and lets a class offer a "may plunder" overload; a *named* `T&&` is an lvalue and must be re-marked with `std::move`, which is a zero-instruction cast that only makes the move members eligible. Moved-from objects are valid but unspecified; `std::move` on a `const` object copies.
- `T&&` on a *deduced* `T` is a forwarding reference: `T` deduces to `X&` for lvalues and `X` for rvalues, reference collapsing keeps `X& &&` an lvalue reference, and `std::forward<T>` casts accordingly, so one template passes every argument on with its original category. This is the machinery under `make_unique`, `emplace`, and every factory.
- A lambda is a compiler-written class: one member per capture (`[n]` copies, `[&n]` stores a pointer, `[k = expr]` initializes from an expression), an `operator()` that is `const` unless `mutable`, `sizeof` equal to the captures, a unique type that inlines through templates, and a function-pointer conversion when there are no captures. `std::function` erases that type at the price of an indirect call.
- Threads share the heap and globals and nothing else; a data race (two unordered accesses, one a write) is undefined behavior that the optimizer exploits, not merely a lost update. `std::atomic` turns an access into a `lock`-prefixed instruction with a chosen memory order (default `seq_cst`); a mutex turns a region into a critical section, with RAII guards and one fixed acquisition order or `std::scoped_lock` to avoid deadlock; `std::jthread` joins at scope exit; ThreadSanitizer finds both races and lock-order cycles.

### Guided Challenges
1. **Make the optimizer show its hand.** Take Pitfall 1's program, keep the race, and compile it at `-O2` three ways: as is, with `counter` declared `volatile long`, and with `std::atomic<long>` and `memory_order_relaxed`. Disassemble the loop each time and explain the three instruction sequences; then explain why `volatile` still loses updates under ThreadSanitizer even though the loop is no longer folded.
   **Hint:** `volatile` forbids the compiler from eliding or reordering *its own* accesses to that object; it says nothing to the other core, and `add` without `lock` is still three micro-steps on the bus.
2. **Publish safely.** Write a producer thread that fills a `std::vector<int>` and then sets a flag, and a consumer that spins on the flag and then sums the vector. Implement the flag first as a plain `bool` (run under ThreadSanitizer), then as `std::atomic<bool>` with `memory_order_relaxed` on both sides, then with `release` on the store and `acquire` on the load. For each, say whether the consumer is guaranteed to see the *filled* vector and why, using the words "happens-before".
   **Hint:** atomicity of the flag is not the question; the question is whether the vector's writes are ordered before the flag's write *for the other thread*, and only release/acquire (or seq_cst) creates that edge.
