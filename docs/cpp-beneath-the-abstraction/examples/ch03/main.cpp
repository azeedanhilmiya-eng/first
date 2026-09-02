// main.cpp -- Chapter 3: where objects live, and what pointers and references
// compile to. Every line printed is a deterministic fact about this process;
// no raw address is ever printed, only relationships between addresses.
#include <cstddef>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <string_view>
#include <vector>

#include <unistd.h>  // getpid: a plain C function that lives inside libc.so

#include "regions.h"

namespace {

void heading(std::string_view text) { std::cout << "\n== " << text << " ==\n"; }

// The only way to do arithmetic on addresses of unrelated objects: as integers.
[[nodiscard]] std::uintptr_t addr(const void* p) noexcept {
    return reinterpret_cast<std::uintptr_t>(p);
}

// ---- 1. address space -----------------------------------------------------
const int kConfigVersion = 3;  // const, address taken: lands in .rodata (read-only)
int g_initialized = 7;         // non-zero initial value: stored in the file, .data
int g_zeroed;                  // zero-initialized: .bss, costs no bytes on disk

void some_function() {}        // machine code: .text

void show_address_space() {
    heading("1. Address space: which mapping holds each object");
    int local = 0;
    auto* small = new int(1);          // 4 bytes: glibc carves it from the brk heap
    auto* large = new char[1 << 20];   // 1 MiB: above glibc's mmap threshold (128 KiB)

    struct Row { const char* what; std::uintptr_t where; };
    const Row rows[] = {
        {"some_function (code)",        reinterpret_cast<std::uintptr_t>(&some_function)},
        {"kConfigVersion (const int)",  addr(&kConfigVersion)},
        {"g_initialized (int = 7)",     addr(&g_initialized)},
        {"g_zeroed (int, no init)",     addr(&g_zeroed)},
        {"*small (new int)",            addr(small)},
        {"*large (new char[1 MiB])",    addr(large)},
        {"local (stack variable)",      addr(&local)},
        {"getpid (libc function)",      reinterpret_cast<std::uintptr_t>(&getpid)},
    };
    for (const Row& r : rows)
        std::cout << "  " << std::left << std::setw(28) << r.what << mem::region_of(r.where) << '\n';

    std::cout << std::boolalpha;
    std::cout << "  code < rodata < data/bss < heap < stack: "
              << (rows[0].where < rows[1].where && rows[1].where < rows[2].where &&
                  rows[3].where < rows[4].where && rows[4].where < rows[6].where) << '\n';
    std::cout << "  every user-space address is below 2^47:  "
              << (rows[6].where < (std::uintptr_t{1} << 47)) << '\n';
    delete small;
    delete[] large;
}

// ---- 2. stack frames --------------------------------------------------------
// Each call receives a fresh frame; a local's address tells us where the frame is.
void record_frames(int depth, std::vector<std::uintptr_t>& frames) {
    int marker = depth;  // lives in THIS call's frame, at a fixed offset from its base
    frames.push_back(addr(&marker));
    if (depth + 1 < 4) record_frames(depth + 1, frames);
}  // marker's lifetime ends here; the next call at this depth will reuse its slot

void show_stack_frames() {
    heading("2. Stack frames: one per call, carved by moving the stack pointer");
    std::vector<std::uintptr_t> frames;
    record_frames(0, frames);
    for (std::size_t i = 1; i < frames.size(); ++i)
        std::cout << "  frame " << i - 1 << " -> frame " << i << ": the callee's local sits "
                  << frames[i - 1] - frames[i] << " bytes LOWER (g++ -O0 frame size)\n";
    std::cout << "  the stack grows downward:                  " << (frames[0] > frames[3]) << '\n';

    std::vector<std::uintptr_t> again;
    record_frames(0, again);
    std::cout << "  a second identical call chain reuses the same slots: " << (frames == again)
              << '\n';
}

// ---- 3. pointer arithmetic --------------------------------------------------
struct Record {
    char tag;
    double value;  // 8-byte alignment forces 7 bytes of padding after `tag` (section 5)
};

void show_pointer_arithmetic() {
    heading("3. Pointer arithmetic is scaled by sizeof(*p)");
    int ints[5] = {10, 20, 30, 40, 50};
    double doubles[3] = {1.5, 2.5, 3.5};
    Record records[2] = {{'a', 1.0}, {'b', 2.0}};
    const int* p = ints;  // array-to-pointer decay: p == &ints[0]

    std::cout << "  int*:    p + 1 is " << addr(p + 1) - addr(p) << " bytes further\n";
    std::cout << "  double*: p + 1 is " << addr(doubles + 1) - addr(doubles) << " bytes further\n";
    std::cout << "  Record*: p + 1 is " << addr(records + 1) - addr(records)
              << " bytes further (sizeof(Record) = " << sizeof(Record) << ")\n";
    std::cout << "  ints[3] = " << ints[3] << ", *(ints + 3) = " << *(ints + 3) << ", 3[ints] = " << 3[ints]
              << "  (a[i] is defined as *(a + i))\n";
    std::cout << "  &ints[4] - &ints[0] = " << (&ints[4] - &ints[0]) << " elements = "
              << addr(&ints[4]) - addr(&ints[0]) << " bytes\n";
    std::cout << "  sizeof(ints) = " << sizeof(ints) << " bytes, sizeof(p) = " << sizeof(p)
              << " bytes: the array decayed to one address\n";

    const auto* bytes = reinterpret_cast<const unsigned char*>(ints);
    std::cout << "  first 8 bytes of ints:" << std::hex << std::setfill('0');
    for (int i = 0; i < 8; ++i) std::cout << ' ' << std::setw(2) << static_cast<int>(bytes[i]);
    std::cout << std::dec << std::setfill(' ') << "  (10 then 20, little-endian)\n";
}

// ---- 4. references ----------------------------------------------------------
void increment_via_pointer(int* p) noexcept { ++*p; }   // caller must write &x; may be null
void increment_via_reference(int& r) noexcept { ++r; }  // caller writes x; cannot be null

struct Holder {
    int& ref;  // a reference member must be stored: it occupies one pointer
};

void show_references() {
    heading("4. References: a pointer the compiler dereferences for you");
    int x = 10;
    int& r = x;  // bound once, here, forever
    r = 20;
    increment_via_pointer(&x);
    increment_via_reference(x);
    std::cout << "  x after r = 20, ++*p, ++r: " << x << '\n';
    std::cout << "  &r == &x: " << (&r == &x) << "  (a reference has no address of its own)\n";
    std::cout << "  sizeof(Holder) = " << sizeof(Holder) << "  (a stored reference is an 8-byte address)\n";

    int y = 1;
    r = y;  // does NOT rebind r to y: it copies y's value into x
    std::cout << "  after r = y: x = " << x << ", &r == &x still " << (&r == &x) << '\n';

    int* p = nullptr;
    std::cout << "  nullptr: sizeof(std::nullptr_t) = " << sizeof(std::nullptr_t)
              << ", bool(p) = " << static_cast<bool>(p) << ", p == nullptr: " << (p == nullptr) << '\n';
}

// ---- 5. alignment and padding ----------------------------------------------
struct Padded {
    char tag;    // offset 0, then 3 bytes of padding so `value` can start at 4
    int value;   // offset 4
    char flag;   // offset 8, then 3 bytes of tail padding so arrays keep 4-byte alignment
};

struct Reordered {
    int value;   // offset 0
    char tag;    // offset 4
    char flag;   // offset 5, then 2 bytes of tail padding
};

struct alignas(64) CacheLineCounter {
    int hits;    // 4 bytes of data, padded to a whole 64-byte cache line
};

void show_alignment() {
    heading("5. Alignment and padding: the compiler inserts invisible bytes");
    std::cout << "  Padded    {char, int, char}: sizeof " << sizeof(Padded) << ", alignof "
              << alignof(Padded) << ", offsets tag=" << offsetof(Padded, tag)
              << " value=" << offsetof(Padded, value) << " flag=" << offsetof(Padded, flag) << '\n';
    std::cout << "  Reordered {int, char, char}: sizeof " << sizeof(Reordered) << ", alignof "
              << alignof(Reordered) << ", offsets value=" << offsetof(Reordered, value)
              << " tag=" << offsetof(Reordered, tag) << " flag=" << offsetof(Reordered, flag) << '\n';
    std::cout << "  alignas(64) CacheLineCounter: sizeof " << sizeof(CacheLineCounter)
              << ", alignof " << alignof(CacheLineCounter) << '\n';
    std::cout << "  alignof: char " << alignof(char) << ", short " << alignof(short) << ", int "
              << alignof(int) << ", double " << alignof(double) << ", void* " << alignof(void*)
              << ", max_align_t " << alignof(std::max_align_t) << '\n';

    Padded on_stack{};
    double d = 0.0;
    auto* on_heap = new Padded{};
    std::cout << "  addresses are multiples of alignof: stack Padded "
              << (addr(&on_stack) % alignof(Padded) == 0) << ", stack double "
              << (addr(&d) % alignof(double) == 0) << ", heap Padded "
              << (addr(on_heap) % alignof(std::max_align_t) == 0) << " (new aligns to 16)\n";
    delete on_heap;

    std::cout << "  1000 Padded occupy " << 1000 * sizeof(Padded) << " bytes; 1000 Reordered occupy "
              << 1000 * sizeof(Reordered) << " bytes: same data, one third less memory\n";
}

}  // namespace

int main() {
    std::cout << "Chapter 3 probe: g++ 13, x86-64 Linux";
    show_address_space();
    show_stack_frames();
    show_pointer_arithmetic();
    show_references();
    show_alignment();
    return 0;
}
