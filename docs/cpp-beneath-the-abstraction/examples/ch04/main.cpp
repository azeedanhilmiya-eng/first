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
