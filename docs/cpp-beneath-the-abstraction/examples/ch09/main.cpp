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
