# Chapter 3: Pointers, References, and Memory Architecture

> Series: C++: From Beginner to Advanced: Beneath the Abstraction
> Standard: C++20 (`-std=c++20`) · Toolchain used for every output below: g++ 13.3 on x86-64 Linux

## 1. Motivation and Mental Model

### Core Problem
C++ hands you the real addresses of your objects, so you must know where each object lives, how long that storage lasts, and how the compiler turns address arithmetic and alignment into bytes, because nothing at run time will check any of it for you.

### Analogy / Python-Java Contrast
Picture a city where every building has a street address, and a **Pointer (指针)** is a slip of paper with an address written on it. You can copy the slip, add 3 to the number to reach the third house down the block, or walk to the address and look inside. Nobody checks that the building still exists; if it was demolished yesterday, you walk into an empty lot. A **Reference (引用)** is different: it is a second name plate screwed onto one specific building the day the building is finished. It cannot be blank and cannot be moved to another building afterwards.

Python has neither. Every Python variable is a hidden pointer to a heap object, but you cannot see the number, cannot add to it, and cannot point into the middle of anything; `id(x)` shows you the address as a curiosity, and the reference counter demolishes buildings only when the last slip is gone. Java's references are also hidden pointers: they can be `null`, they can be reassigned, but there is no arithmetic and the garbage collector guarantees that a reachable object is never demolished, and may even move buildings to new addresses behind your back.

C++ exposes the whole city. Objects live in one of a handful of districts, each with its own rules for who builds and who demolishes: the **Stack (栈)** is torn down automatically when a function returns, the **Heap (堆)** persists until you say `delete`, and static storage lives as long as the process. The address a pointer holds is a plain 64-bit number, and the type the compiler attached to it at compile time is the only thing that says how many bytes to read there and how far `p + 1` should step. This chapter is the map of the city, so that the "why did it crash" and "why did it print garbage" questions of every later chapter have somewhere to point.

## 2. Deep Dive and Low-Level Mechanics

### 2.1 The virtual address space: one private city per process

When the kernel starts your program it does not hand it physical RAM. It builds a **Virtual Memory (虚拟内存)** map, an **Address Space (地址空间)** of 2^47 bytes (128 TiB) in which almost everything is empty, and fills in a few small regions. The CPU translates every address your code uses through a **Page Table (页表)** in units of one **Page (页)**, 4096 bytes on this machine (`getconf PAGESIZE`). A page that is not in the map, or that is used in a way its permissions forbid (writing to code, executing data), raises a fault in the CPU, and the kernel turns that fault into the signal `SIGSEGV`: the **Segmentation Fault (段错误)** that ends so many first C++ programs.

Linux publishes the map of the running process as text. Here is the map of a program with one global, one `new int`, and the standard library loaded (paths shortened; `./main` is the executable's own file):

```text
$ cat /proc/self/maps                      (from inside the process; excerpt)
55f2454e8000-55f2454ea000 r--p ./main       ELF headers, .dynsym ...
55f2454ea000-55f2454eb000 r-xp ./main       .text        machine code: read + execute, never write
55f2454eb000-55f2454ec000 r--p ./main       .rodata      string literals, const tables
55f2454ec000-55f2454ed000 r--p ./main       .got         relocated at load, then made read-only
55f2454ed000-55f2454ee000 rw-p ./main       .data + .bss globals: read + write
55f26eb4a000-55f26eb6b000 rw-p [heap]                    the brk heap: small new/malloc blocks
7fed74800000-7fed74828000 r--p /usr/lib/.../libc.so.6
7fed74828000-7fed749b0000 r-xp /usr/lib/.../libc.so.6    shared library code (getpid lives here)
...
7fed74c9d000-7fed74de5000 r-xp /usr/lib/.../libstdc++.so.6.0.33
...
7ffe639e6000-7ffe63a08000 rw-p [stack]                   grows downward, 8 MiB limit (ulimit -s)
```

```text
Diagram 1 — the x86-64 Linux address space of one process (not to scale; g++ 13 default PIE)

  0xffff'ffff'ffff'ffff ┌───────────────────────────────┐
                        │ kernel                        │  upper half: never yours; any touch = SIGSEGV
  0xffff'8000'0000'0000 ├───────────────────────────────┤
                        │ (non-canonical hole)          │  bits 47..63 must all equal bit 47
  0x0000'7fff'ffff'ffff ├───────────────────────────────┤ ◀── highest user address: below 2^47
                        │ [stack]        rw-   grows ▼  │  main's frame at the top, callees below;
                        │   ...                         │  the kernel maps pages on demand, up to 8 MiB
                        ├───────────────────────────────┤
                        │ mmap region:   libs, big new  │  libstdc++.so, libc.so, and every allocation
                        │   libstdc++ r--/r-x/rw-       │  larger than glibc's 128 KiB threshold
                        │   libc      r--/r-x/rw-       │  (our `new char[1 MiB]` landed here)
                        │   anonymous rw-               │
  0x0000'7f..           ├───────────────────────────────┤
                        │   (huge empty gap)            │  ASLR puts a random distance here
  0x0000'55..           ├───────────────────────────────┤
                        │ [heap]         rw-   grows ▲  │  brk heap: small `new`/`malloc` blocks
                        ├───────────────────────────────┤
                        │ .data + .bss   rw-            │  Data Segment (数据段): g_initialized = 7 (in file)
                        │                               │  BSS Segment (未初始化数据段): g_zeroed (zero-filled)
                        │ .got           r--            │
                        │ .rodata        r--            │  kConfigVersion, "Chapter 3 probe: ..."
                        │ .text          r-x            │  Text Segment (代码段): some_function, main
                        │ ELF headers    r--            │
  0x0000'0000'0000'0000 └───────────────────────────────┘  page 0 is never mapped: nullptr faults here
```

Each region has a different owner and a different **Lifetime (生命周期)**, which the language calls **Storage Duration (存储期)**:

| Region | Who creates it | Who destroys it | C++ storage duration |
|--------|----------------|-----------------|----------------------|
| `.text`, `.rodata`, `.data`, `.bss` | the loader, from the ELF file (Chapter 1) | process exit | *static*: globals, `static` locals, string literals |
| `[heap]` and anonymous mmaps | `new` / `malloc`, which ask the kernel for pages via `brk` or `mmap` | `delete` / `free`, or never (a **Memory Leak (内存泄漏)**) | *dynamic* |
| `[stack]` | the kernel reserves it; each function call claims a slice by moving a **Register (寄存器)** | each function return, automatically | *automatic*: locals, parameters |

The example's first section asks the kernel where eight objects live and prints the answer straight from `/proc/self/maps`. The `new int` went to `[heap]`; the `new char[1 << 20]` went to an anonymous mmap because glibc hands anything over 128 KiB (its default threshold, which adapts upward as large blocks are freed) its own pages, so that freeing it returns memory to the kernel immediately.

**Address Space Layout Randomization (地址空间布局随机化)** is why this chapter never prints an address: the executable, heap, libraries, and stack all land at a different base on every run, so an attacker cannot guess where anything is. Relationships between addresses are stable; the numbers are not.

### 2.2 The stack, one function call at a time

The stack is the region you use most and see least. It is one contiguous block whose top is tracked by the register `%rsp`; a function *claims* space by subtracting from `%rsp` and *releases* it by adding the same amount back. Nothing is ever "freed" in the heap sense; the memory simply becomes the next call's territory. Here is the example's recursive `record_frames` exactly as g++ compiled it at `-O0`:

```text
$ objdump -d -C --no-show-raw-insn main | grep -A34 'record_frames(int, std::vector'
0000000000004b21 <(anonymous namespace)::record_frames(int, std::vector<...>&)>:
    4b21:	endbr64
    4b25:	push   %rbp                  ; prologue: save the caller's frame base
    4b26:	mov    %rsp,%rbp             ;           this frame's base = current top
    4b29:	sub    $0x30,%rsp            ;           claim 48 bytes for locals + temporaries
    4b2d:	mov    %edi,-0x24(%rbp)      ; parameter depth   -> slot at rbp-36
    4b30:	mov    %rsi,-0x30(%rbp)      ; parameter &frames -> slot at rbp-48
    4b34:	mov    %fs:0x28,%rax         ; stack protector: copy the canary ...
    4b3d:	mov    %rax,-0x8(%rbp)       ; ... into the slot just below the saved rbp
    4b41:	xor    %eax,%eax
    4b43:	mov    -0x24(%rbp),%eax
    4b46:	mov    %eax,-0x14(%rbp)      ; int marker = depth;   marker lives at rbp-20
    4b49:	lea    -0x14(%rbp),%rax      ; &marker: ONE instruction, an address computation
    4b4d:	mov    %rax,%rdi
    4b50:	call   4710 <(anonymous namespace)::addr(void const*)>
    ...
    4b6c:	cmpl   $0x2,-0x24(%rbp)      ; if (depth + 1 < 4)
    4b70:	jg     4b86
    ...
    4b81:	call   4b21 <record_frames>  ; recursion: pushes the 8-byte return address
    4b87:	mov    -0x8(%rbp),%rax
    4b8b:	sub    %fs:0x28,%rax         ; epilogue: is the canary intact?
    4b94:	je     4b9b
    4b96:	call   4490 <__stack_chk_fail@plt>
    4b9b:	leave                        ; mov %rbp,%rsp ; pop %rbp  -> frame released
    4b9c:	ret                          ; pop the return address into %rip
```

Every call therefore costs exactly: 8 bytes for the **Return Address (返回地址)** pushed by `call`, 8 bytes for the saved `%rbp`, and the 48 bytes claimed by `sub`. That is 64 bytes, which is precisely the distance the example measures between the `marker` variables of consecutive frames.

```text
Diagram 2 — three nested calls of record_frames on the stack (x86-64, g++ -O0, addresses relative)

  higher addresses
        │ ... show_stack_frames' frame ...                      │
        ├──────────────────────────────────────────────────────┤ ◀── %rsp before the first call
        │ return address into show_stack_frames        8 bytes │ pushed by `call`
  frame ├──────────────────────────────────────────────────────┤
    0   │ saved %rbp of the caller                     8 bytes │ ◀── %rbp of frame 0
        │ canary (copy of %fs:0x28)                rbp-8       │
        │ std::uintptr_t temp (addr result)        rbp-16      │
        │ int marker = 0                           rbp-20      │ ◀── frames[0] = &marker
        │ int depth                                rbp-36      │
        │ std::vector* &frames                     rbp-48      │
        │ (alignment slack)                                    │  sub $0x30 = 48 bytes
        ├──────────────────────────────────────────────────────┤
        │ return address into frame 0                  8 bytes │
  frame ├──────────────────────────────────────────────────────┤
    1   │ saved %rbp (= frame 0's base)                8 bytes │
        │ ... same layout ...                                  │
        │ int marker = 1                           rbp-20      │ ◀── frames[1] = frames[0] - 64
        ├──────────────────────────────────────────────────────┤
  frame │ return address into frame 1                          │
    2   │ ... int marker = 2 ...                               │ ◀── frames[2] = frames[0] - 128
        ├──────────────────────────────────────────────────────┤ ◀── %rsp now
  lower │ unused stack: the NEXT call will overwrite this      │
  addresses
```

Three facts fall out of this picture and drive the rest of the series:

1. **Locals are addresses relative to `%rbp`.** `&marker` is a single `lea` instruction; nothing is looked up by name. Taking a pointer to a local costs nothing, which is also why it is so easy to keep one too long.
2. **Returning is `leave; ret`.** The frame is not zeroed, not marked, not protected; `%rsp` simply moves back up. The bytes of `marker` are still there until the next call overwrites them. A pointer to a local that has returned is a **Dangling Pointer (悬垂指针)**: it holds a valid-looking address into memory that now belongs to someone else. The example proves the reuse: a second identical call chain gets *exactly* the same addresses.
3. **The canary is the only guard.** Ubuntu's g++ enables `-fstack-protector-strong`, so any function with an address-taken local writes a secret value below the saved `%rbp` and checks it before `ret`. Overrunning a local array smashes the canary and the program aborts with `*** stack smashing detected ***` instead of jumping to an attacker's return address. It catches overruns, not dangling pointers.

The stack's size is limited: `ulimit -s` prints 8192 KiB here. A recursion 64 bytes deep per call can go roughly 130,000 levels before the kernel refuses to map another page and kills the process with `SIGSEGV`, the classic stack overflow.

### 2.3 What a pointer is, and what the compiler does with it

A pointer is an 8-byte integer (`sizeof(void*) == 8` on LP64) that holds an address, plus a *type* that exists only at compile time. The type answers two questions for the compiler and then disappears:

- **How many bytes to move when I dereference?** `*p` for `int* p` is `mov (%rdi),%eax`, a 4-byte load; for `double*` it is an 8-byte `movsd`; for a `Record*` it is a copy of 16 bytes. **Dereference (解引用)** means "use this number as an address and read or write `sizeof(*p)` bytes there". No instruction checks that the address is valid: the CPU either finds a mapped page or faults.
- **How far is `p + 1`?** `sizeof(*p)` bytes further. **Pointer Arithmetic (指针算术)** is always scaled by the pointee's size, so `p + i` is the address of the *i*-th element after `*p`, whatever the element type. The example's section 3 measures it: 4, 8 and 16 bytes for `int`, `double` and `Record`. At `-O0` the three `p + 1` computations are literally `add $0x4,%rax`, `add $0x8,%rax`, `add $0x10,%rax`; the compiler folded the multiplication by `sizeof` into a constant.

```text
Diagram 3 — int ints[5] = {10, 20, 30, 40, 50}; const int* p = ints;   (little-endian bytes)

  byte offset   0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19
              ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
  contents    │0a │00 │00 │00 │14 │00 │00 │00 │1e │00 │00 │00 │28 │00 │00 │00 │32 │00 │00 │00 │
              └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                ▲ ints[0]        ▲ ints[1]        ▲ ints[2]        ▲ ints[3]        ▲ ints[4]
                p = ints         p + 1            p + 2            p + 3            p + 4
                                 = (char*)p + 4                    = *(p+3) = 3[p] = 40

  sizeof(ints) == 20      the array object: five ints, contiguous, no header, no length field
  sizeof(p)    == 8       one address; p has forgotten that there are five of them
  &ints[4] - &ints[0] == 4 (elements), not 16: subtracting pointers divides by sizeof(int)
```

Three consequences:

- **Arrays decay.** The name of an array converts to a pointer to its first element in almost every expression, and once that happens the length is gone. `sizeof(ints)` is 20 inside the scope that declared the array and 8 the moment it is passed to a function as `int*`. This is why C++ containers (`std::vector`, `std::array`, `std::span`) exist: they carry the size with the address.
- **`a[i]` is `*(a + i)` by definition**, which is why `3[ints]` is legal (addition commutes) and why an index is never checked: it is an `add` followed by a load.
- **`nullptr` is address 0 with its own type**, `std::nullptr_t`, 8 bytes wide. Page 0 is never mapped, so dereferencing a **Null Pointer (空指针)** faults at address `0x0` plus the member offset, which is why crash reports so often say `SEGV on unknown address 0x000000000008` (Pitfall 1 shows exactly that). A pointer converts to `bool` as "not null", so `if (p)` is a plain compare with zero.

There is no run-time record of what a pointer points to. That absence is the whole difference from Python and Java, and the whole reason the sanitizers of this series exist: they add the records the language leaves out.

### 2.4 References: a pointer the compiler dereferences for you

A reference is a name bound to an existing object. The binding happens once, at initialization, and cannot change: `int& r = x;` makes every later `r` mean `x`, and `r = y` copies `y`'s value *into `x`* rather than re-pointing `r` (the example prints the proof). A reference cannot be null because it must be initialized from an object, and it cannot be "reseated".

Under the hood a reference is implemented exactly like a pointer, when it is implemented at all. Compile these two functions at `-O2`:

```text
$ g++ -std=c++20 -O2 -c refprobe.cpp && objdump -d -C --no-show-raw-insn refprobe.o
0000000000000000 <increment_via_pointer(int*)>:
   4:	addl   $0x1,(%rdi)
   7:	ret
0000000000000010 <increment_via_reference(int&)>:
  14:	addl   $0x1,(%rdi)
  17:	ret
```

Byte-for-byte identical: the caller passes an address in `%rdi` either way, and the callee adds one to the memory it names. When the compiler can see the bound object (a reference to a local in the same function), it often needs no storage at all and simply uses the object directly. When a reference must be *stored*, as the member of `Holder` in the example, it occupies 8 bytes, because the object has to remember an address.

```text
Diagram 4 — the same operation through a pointer and a reference

   int x = 10;                                    memory
   int* p = &x;      p ──────────────▶  x: ┌────────────┐  ┌── r (no separate object;
   int& r = x;       r ─ ─ ─ ─ ─ ─ ─ ▶     │ 0a 00 00 00│◀─┘   "r" is another name for x)
                                            └────────────┘
   *p = 20;   ──▶  mov (%rdi) ...    ; explicit dereference in the source
    r = 20;   ──▶  mov (%rdi) ...    ; the same instruction; the dereference is implicit
   p = &y;    ──▶  legal: the slip of paper is rewritten
   r = y;     ──▶  copies y INTO x; a name plate cannot be moved
   p = nullptr; ─▶ legal; *p later = SIGSEGV
   int& q;    ──▶  compile error: a reference must be bound at birth

   sizeof(p) == 8            struct Holder { int& ref; };  sizeof(Holder) == 8  (stored as an address)
```

The design rule that follows, and that the rest of the series obeys: **use a reference when the thing must exist and you are not going to re-point; use a pointer when "nothing" is a valid value or when you need to walk memory.** A Java developer's `Foo foo` parameter that "must not be null" is a `const Foo&` in C++; one that may be absent is a `const Foo*` (or `std::optional`). A reference cannot dangle any less than a pointer can, though: binding `int& r` to a local and returning `r` is the same bug as returning `&local` (Pitfall 1), just without the `*`.

### 2.5 Memory alignment and padding

Hardware reads memory in aligned units. A 4-byte `int` whose address is a multiple of 4 is one load; the same `int` straddling two cache lines or two pages costs two loads and a merge on x86, and on many ARM and all SPARC systems it is a `SIGBUS` crash. Vector instructions (`movaps`) and atomic operations *require* natural alignment even on x86. So every type has an alignment requirement, `alignof(T)`, and the C++ standard makes an object at a misaligned address **Undefined Behavior (未定义行为)** (Pitfall 3), even though the x86 hardware would usually tolerate it.

**Memory Alignment (内存对齐)** rules on this ABI are simple: a fundamental type's alignment equals its size (`char` 1, `short` 2, `int` 4, `double` 8, pointers 8), a struct's alignment is the largest alignment among its members, and every member must start at an offset that is a multiple of its own alignment. The compiler satisfies that rule by inserting **Padding (填充)** bytes, and it rounds the struct's total size up to a multiple of its alignment so that arrays of the struct stay aligned. It never reorders members: C++ guarantees declaration order for members of the same access level, so the layout is entirely in your hands.

```text
Diagram 5 — the example's two structs, byte by byte (x86-64; * = padding the compiler inserted)

  struct Padded { char tag; int value; char flag; };           sizeof 12, alignof 4
    offset   0    1    2    3    4    5    6    7    8    9   10   11
           ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
           │tag │ *  │ *  │ *  │      value (4)    │flag│ *  │ *  │ *  │
           └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
             value must start at a multiple of 4 ──┘  tail padding so Padded[2] starts at 12

  struct Reordered { int value; char tag; char flag; };        sizeof 8, alignof 4
    offset   0    1    2    3    4    5    6    7
           ┌────┬────┬────┬────┬────┬────┬────┬────┐
           │      value (4)    │tag │flag│ *  │ *  │            same three fields, 4 bytes fewer:
           └────┴────┴────┴────┴────┴────┴────┴────┘            sort members by alignment, largest first

  struct alignas(64) CacheLineCounter { int hits; };           sizeof 64, alignof 64
           ┌────┬────┬────┬────┬──── ... 60 bytes of padding ... ────┐
           │     hits (4)      │                                     │  one object per Cache Line (缓存行):
           └────┴────┴────┴────┴──── ... ────────────────────────────┘  two threads' counters never share a line
```

`offsetof(Padded, value)` is 4, not 1, and the example shows every number in the diagram. Three practical rules:

1. **Order members from largest alignment to smallest** and structs shrink for free; the example's `Reordered` saves a third of the memory of `Padded` with identical fields. In a `std::vector` of a million elements that is the difference between fitting in cache or not.
2. **Never assume `sizeof(struct)` equals the sum of its fields**, and never write a struct to a file or a socket as raw bytes (Pitfall 4): the padding bytes are unspecified garbage, and the layout is this compiler's on this ABI.
3. **Heap allocations come pre-aligned.** `new` returns memory aligned to `alignof(std::max_align_t)`, 16 bytes here (`__STDCPP_DEFAULT_NEW_ALIGNMENT__`), enough for every fundamental type; an over-aligned type such as `CacheLineCounter` makes `new` call the aligned overload `operator new(std::size_t, std::align_val_t)` automatically since C++17. The stack is aligned by the compiler: it knows every local's alignment and places it accordingly, which is one more reason `%rsp` moves in multiples of 16 at calls.

### 2.6 Compile time versus run time for one dereference

```text
Diagram 6 — the life of  `int v = p[3];`  with  const int* p

  COMPILE TIME (g++ reading main.cpp)                        RUN TIME (the CPU)
  ─────────────────────────────────────────────────────      ────────────────────────────────────
  p has type `const int*` ⇒ element size 4, alignment 4      (types no longer exist)
  p[3]  ≡  *(p + 3)  ≡  *(address in p, plus 3 × 4)          rax = p ; rax += 12   (one add, or folded
                                                              into the addressing mode: 0xc(%rax))
  a 4-byte load, sign irrelevant (it is a copy)              eax = load 4 bytes at rax
  no bounds exist to check: the array length is gone         page mapped?  yes → value.  no → SIGSEGV
  v is a local ⇒ slot at some rbp-N                          store eax to that slot
```

Every decision in the left column is baked into two or three instructions on the right. The right column has no idea whether `p` still points at a live object, whether index 3 is inside the array, or whether the address is aligned. Those are the three pitfalls below, and they are the three questions the sanitizers were written to ask at run time on your behalf.

## 3. Complete, Production-Grade Code Example

A two-file probe. `regions.cpp` asks the kernel, through `/proc/self/maps`, which mapping contains an address. `main.cpp` uses it to locate eight objects, then measures stack frames, pointer arithmetic, references, and struct layout from live objects. No raw address is printed, only relationships, so the output is identical on every run despite ASLR.

**`examples/ch03/regions.h`**
```cpp
// regions.h -- ask the kernel which memory mapping contains an address.
//
// Linux publishes every process's memory map as text in /proc/self/maps. This
// tiny helper lets the example prove, from a live process, where each kind of
// object actually lives instead of asking you to take a diagram on faith.
#ifndef CH03_REGIONS_H
#define CH03_REGIONS_H

#include <cstdint>
#include <string>

namespace mem {

// Describes the mapping that contains `address`, e.g. "the executable (r-x)",
// "[heap] (rw-)", "[stack] (rw-)", "a shared library (rw-)", "an anonymous mmap (rw-)".
[[nodiscard]] std::string region_of(std::uintptr_t address);

}  // namespace mem

#endif  // CH03_REGIONS_H
```

**`examples/ch03/regions.cpp`**
```cpp
// regions.cpp -- parse /proc/self/maps and classify one address.
#include "regions.h"

#include <cstdint>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <string>

namespace mem {

std::string region_of(std::uintptr_t address) {
    // Each line: "start-end perms offset dev inode [path]", addresses in hex.
    std::ifstream maps("/proc/self/maps");
    const std::string self = std::filesystem::read_symlink("/proc/self/exe").string();
    std::string line;
    while (std::getline(maps, line)) {
        std::istringstream fields(line);
        std::string range, perms, offset, dev, inode, path;
        fields >> range >> perms >> offset >> dev >> inode;
        std::getline(fields >> std::ws, path);  // the path is optional and may be empty

        const auto dash = range.find('-');
        const auto start = std::stoull(range.substr(0, dash), nullptr, 16);
        const auto end = std::stoull(range.substr(dash + 1), nullptr, 16);
        if (address < start || address >= end) continue;

        std::string what;
        if (path == self)                                  what = "the executable";
        else if (path == "[heap]" || path == "[stack]")    what = path;
        else if (path.find(".so") != std::string::npos)    what = "a shared library";
        else if (path.empty())                             what = "an anonymous mmap";
        else                                               what = path;
        return what + " (" + perms.substr(0, 3) + ")";     // keep r/w/x, drop the p/s flag
    }
    return "not mapped";
}

}  // namespace mem
```

**`examples/ch03/main.cpp`**
```cpp
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
```

**Build and run:**
```text
$ g++ -std=c++20 -Wall -Wextra main.cpp regions.cpp -o main
$ ./main
```
**Terminal Output:**
```text
Chapter 3 probe: g++ 13, x86-64 Linux
== 1. Address space: which mapping holds each object ==
  some_function (code)        the executable (r-x)
  kConfigVersion (const int)  the executable (r--)
  g_initialized (int = 7)     the executable (rw-)
  g_zeroed (int, no init)     the executable (rw-)
  *small (new int)            [heap] (rw-)
  *large (new char[1 MiB])    an anonymous mmap (rw-)
  local (stack variable)      [stack] (rw-)
  getpid (libc function)      a shared library (r-x)
  code < rodata < data/bss < heap < stack: true
  every user-space address is below 2^47:  true

== 2. Stack frames: one per call, carved by moving the stack pointer ==
  frame 0 -> frame 1: the callee's local sits 64 bytes LOWER (g++ -O0 frame size)
  frame 1 -> frame 2: the callee's local sits 64 bytes LOWER (g++ -O0 frame size)
  frame 2 -> frame 3: the callee's local sits 64 bytes LOWER (g++ -O0 frame size)
  the stack grows downward:                  true
  a second identical call chain reuses the same slots: true

== 3. Pointer arithmetic is scaled by sizeof(*p) ==
  int*:    p + 1 is 4 bytes further
  double*: p + 1 is 8 bytes further
  Record*: p + 1 is 16 bytes further (sizeof(Record) = 16)
  ints[3] = 40, *(ints + 3) = 40, 3[ints] = 40  (a[i] is defined as *(a + i))
  &ints[4] - &ints[0] = 4 elements = 16 bytes
  sizeof(ints) = 20 bytes, sizeof(p) = 8 bytes: the array decayed to one address
  first 8 bytes of ints: a0 00 00 00 14 00 00 00  (10 then 20, little-endian)

== 4. References: a pointer the compiler dereferences for you ==
  x after r = 20, ++*p, ++r: 22
  &r == &x: true  (a reference has no address of its own)
  sizeof(Holder) = 8  (a stored reference is an 8-byte address)
  after r = y: x = 1, &r == &x still true
  nullptr: sizeof(std::nullptr_t) = 8, bool(p) = false, p == nullptr: true

== 5. Alignment and padding: the compiler inserts invisible bytes ==
  Padded    {char, int, char}: sizeof 12, alignof 4, offsets tag=0 value=4 flag=8
  Reordered {int, char, char}: sizeof 8, alignof 4, offsets value=0 tag=4 flag=5
  alignas(64) CacheLineCounter: sizeof 64, alignof 64
  alignof: char 1, short 2, int 4, double 8, void* 8, max_align_t 16
  addresses are multiples of alignof: stack Padded true, stack double true, heap Padded true (new aligns to 16)
  1000 Padded occupy 12000 bytes; 1000 Reordered occupy 8000 bytes: same data, one third less memory
```

Reading the output against section 2: the first block is Diagram 1 confirmed by the kernel, including the permissions that make `.text` unwritable and `.rodata` unexecutable, and the 1 MiB allocation that bypassed `[heap]`. The 64-byte frame distance is the `sub $0x30` plus two pushes from section 2.2, and the "reuses the same slots" line is the mechanism behind every dangling-pointer bug. Sections 3 to 5 print the numbers drawn in Diagrams 3 to 5.

## 4. Pitfalls and Anti-Patterns

### Pitfall 1: Returning the address of a local variable
**Buggy Snippet:**
```cpp
const std::string* make_greeting(const std::string& name) {
    std::string greeting = "hello, " + name;  // lives in THIS call's stack frame
    return &greeting;                         // the frame is released on return
}

int main() {
    const std::string* p = make_greeting("world");
    std::cout << *p << '\n';                  // reads an object that no longer exists
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug
p1_bug.cpp: In function 'const std::string* make_greeting(const std::string&)':
p1_bug.cpp:10:12: warning: address of local variable 'greeting' returned [-Wreturn-local-addr]
   10 |     return &greeting;                         // the frame is released on return
      |            ^~~~~~~~~
$ ./p1_bug
Segmentation fault (core dumped)

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p1_bug.cpp -o p1_asan && ./p1_asan
==2285==ERROR: AddressSanitizer: SEGV on unknown address 0x000000000008 (pc ... T0)
    #0 ... in std::operator<< (std::basic_ostream<char>&, std::string const&) (libstdc++.so.6+0x16bd44)
    #1 ... in main p1_bug.cpp:15
```
**Underlying Cause:** `greeting` is an automatic object: it lives at a negative offset from `make_greeting`'s `%rbp`, and `leave; ret` hands that memory back the moment the function returns (Diagram 2). The returned pointer is dangling. g++ recognizes the pattern, warns, and then does something stronger than warning: it replaces the returned address with a null pointer, which is why the crash is at address `0x8` (the `size` field of a `std::string` that supposedly lives at address 0) rather than a read of stale stack bytes. Without that substitution, or with a less obvious escape route (storing `&greeting` in a global, returning `greeting` by `const std::string&`, capturing it in a lambda), the program often *appears to work* because the dead frame has not been overwritten yet, and then fails on the day a call is inserted in between. In Java or Python the object would simply survive: it lives on the heap, and the reference keeps it alive. In C++ an automatic object's lifetime is its scope, full stop.

**Fix:**
```cpp
[[nodiscard]] std::string make_greeting(const std::string& name) {
    std::string greeting = "hello, " + name;
    return greeting;   // by value: built directly in the caller's storage (Chapter 4)
}

int main() {
    const std::string greeting = make_greeting("world");  // lives in main's frame
    std::cout << greeting << '\n';
}
```
Return by value. It is not a copy in practice: C++17 guarantees that a returned temporary is constructed in place, and a named local is moved at worst (Chapter 4 and 9). When an object genuinely must outlive the call, allocate it on the heap through `std::unique_ptr` (Chapter 6), never by handing out a stack address.

### Pitfall 2: One past the end of a heap array
**Buggy Snippet:**
```cpp
int* scores = new int[4]{90, 85, 77, 68};   // 16 bytes on the heap
int sum = 0;
for (int i = 0; i <= 4; ++i) {              // <= : i reaches 4, and scores[4] is past the end
    sum += scores[i];
}
std::cout << "sum = " << sum << ", average = " << sum / 4 << '\n';
delete[] scores;
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra -O2 p2_bug.cpp -o p2_bug && ./p2_bug     # no warning, at any -O level
sum = 320, average = 80

$ g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p2_bug.cpp -o p2_asan && ./p2_asan
==2312==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x502000000020 at pc ... bp ... sp ...
READ of size 4 at 0x502000000020 thread T0
    #0 0x55a4b5dc7408 in main p2_bug.cpp:11
0x502000000020 is located 0 bytes after 16-byte region [0x502000000010,0x502000000020)
allocated by thread T0 here:
    #0 0x7f3604afe6c8 in operator new[](unsigned long)
```
**Underlying Cause:** The output is *correct*, which is the worst possible symptom. `scores[4]` is `*(scores + 4)`: an `add` and a 4-byte load from the address 16 bytes past the start of a 16-byte block (Diagram 3). That address is inside the heap page, so the CPU does not fault; it reads whatever glibc keeps there, which happened to be zero in this run, so the sum came out right. Change the allocation pattern, the allocator, or the platform and the same line returns garbage, or, for a *write* one past the end, corrupts the allocator's bookkeeping for the next block and crashes somewhere unrelated much later. Python raises `IndexError` and Java `ArrayIndexOutOfBoundsException` because their arrays carry a length and every index is compared against it; a raw C++ pointer carries nothing. ASan restores the missing record: it surrounds every heap block with poisoned "redzones" and checks each load against them.

**Fix:**
```cpp
const std::vector<int> scores{90, 85, 77, 68};   // the size travels with the data
int sum = 0;
for (int score : scores) {                       // exactly scores.size() iterations
    sum += score;
}
std::cout << "sum = " << sum << ", average = " << sum / static_cast<int>(scores.size()) << '\n';
std::cout << "scores.at(3) = " << scores.at(3) << '\n';  // checked index: throws std::out_of_range
```
Prefer a range-based `for` over an index, and a container over `new[]`. When an index is unavoidable, `.at()` checks it, and `-fsanitize=address` in every test build checks the rest.

### Pitfall 3: Reading an integer from a misaligned address
**Buggy Snippet:**
```cpp
// A wire packet: 1-byte type, then a 4-byte little-endian length starting at byte 1.
alignas(4) unsigned char packet[8] = {0x01, 0x10, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0xcc};

// packet + 1 is an odd address; a uint32_t requires an address divisible by 4.
const auto* length = reinterpret_cast<const std::uint32_t*>(packet + 1);
std::cout << "length = " << *length << '\n';
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug && ./p3_bug          # compiles silently; x86 tolerates it
length = 16

$ g++ -std=c++20 -Wall -Wextra -fsanitize=undefined p3_bug.cpp -o p3_ubsan && ./p3_ubsan
p3_bug.cpp:13:34: runtime error: load of misaligned address 0x7ffd589fe771 for type 'const unsigned int', which requires 4 byte alignment
0x7ffd589fe771: note: pointer points here
 7f 00 00  01 10 00 00 00 aa bb cc  00 33 bb 17 8e e8 1a 2e  00 00 00 00 00 00 00 00  b8 e8 9f 58 fd
              ^
length = 16
```
**Underlying Cause:** The address ends in `1`; a `std::uint32_t` must live at a multiple of 4 (section 2.5). On x86-64 an ordinary `mov` from a misaligned address still works, slower, which is why the plain build prints the right answer and why this bug ships. It is undefined behavior all the same: on ARM, MIPS or SPARC the same load raises `SIGBUS`; on x86 the compiler is entitled to use an aligned SSE instruction for the load once it vectorizes the surrounding loop, and *that* faults. The `reinterpret_cast` also breaks the aliasing rules (an `unsigned char` array is not a `std::uint32_t` object), so the optimizer may reorder the load relative to writes into `packet`. Two lies to the compiler for the price of one cast.

**Fix:**
```cpp
std::uint32_t length = 0;                         // aligned: it is a real uint32_t object
std::memcpy(&length, packet + 1, sizeof length);  // copy the bytes; the compiler emits one load
std::cout << "length = " << length << '\n';
```
`std::memcpy` is the standard's sanctioned way to move bytes between unrelated types, and it is not a function call in practice: at `-O2` the fixed program contains no call to `memcpy` at all, only a plain load (here folded to the constant `16`, since the packet is a compile-time literal). C++20's `std::bit_cast` does the same for whole objects of equal size.

### Pitfall 4: Assuming a struct is the sum of its fields
**Buggy Snippet:**
```cpp
// A 6-byte header as documented by the wire protocol: version(1) length(4) flags(1).
struct WireHeader {
    std::uint8_t version;
    std::uint32_t length;
    std::uint8_t flags;
};
static_assert(sizeof(WireHeader) == 6, "WireHeader must match the 6-byte wire format");

int main() {
    const WireHeader header{1, 16, 0};
    std::fwrite(&header, sizeof header, 1, stdout);  // would write padding bytes too
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug
p4_bug.cpp:13:34: error: static assertion failed: WireHeader must match the 6-byte wire format
   13 | static_assert(sizeof(WireHeader) == 6, "WireHeader must match the 6-byte wire format");
      |               ~~~~~~~~~~~~~~~~~~~^~~~
p4_bug.cpp:13:34: note: the comparison reduces to '(12 == 6)'
```
**Underlying Cause:** `length` needs a 4-byte boundary, so the compiler inserts 3 padding bytes after `version`; `flags` sits at offset 8, and the whole struct is rounded up to 12 so that an array of them stays aligned (Diagram 5). Without the `static_assert` this program would have compiled and written 12 bytes to the socket, six of them padding with unspecified contents, and the receiver would have decoded garbage. The layout is also a property of *this* compiler on *this* ABI: a 32-bit ARM build or a different compiler's packing may differ. A struct is a description of how the CPU should lay out fields for fast access, not a description of bytes on a wire.

**Fix:**
```cpp
// The wire format is a byte layout, so build it explicitly: 6 bytes, no padding,
// little-endian length regardless of the CPU.
[[nodiscard]] std::array<std::byte, 6> encode(const WireHeader& h) noexcept {
    std::array<std::byte, 6> out{};
    out[0] = static_cast<std::byte>(h.version);
    for (int i = 0; i < 4; ++i)
        out[1 + i] = static_cast<std::byte>((h.length >> (8 * i)) & 0xFFu);
    out[5] = static_cast<std::byte>(h.flags);
    return out;
}
```
```text
$ g++ -std=c++20 -Wall -Wextra p4_fix.cpp -o p4_fix && ./p4_fix | od -An -tx1
 01 10 00 00 00 00
```
Serialize field by field into a byte array, and decode the same way with `std::memcpy`. The non-standard `[[gnu::packed]]` attribute removes the padding, but it makes every access to `length` a misaligned access (Pitfall 3) and taking a reference or pointer to such a member is a bug waiting to happen; explicit encoding costs the same instructions and lies to nobody.

## 5. Summary and Self-Assessment

### Core Takeaways
- A process sees a private virtual address space in which a few regions are mapped: the executable's `.text` (read + execute), `.rodata` (read), `.data`/`.bss` (read + write), the `[heap]` and mmap regions that `new` draws from, shared libraries, and the `[stack]`. Every region has an owner and a storage duration; touching an unmapped page or breaking a permission is a `SIGSEGV`, and ASLR moves every region on every run.
- A function call is `call` (push the return address), `push %rbp; mov %rsp,%rbp; sub $N,%rsp` (claim a frame), and `leave; ret` (release it). Locals are offsets from `%rbp`, their storage is reused by the very next call, and a pointer or reference to one that has returned is dangling; the canary catches overruns, nothing catches dangling.
- A pointer is an 8-byte address plus a compile-time type that fixes two numbers: how many bytes `*p` moves and how far `p + 1` steps (`sizeof(*p)`). Arrays decay to pointers and lose their length; `a[i]` is `*(a + i)` with no check; `nullptr` is address 0 on a page that is never mapped. A reference compiles to the same instructions as a pointer but is bound once, cannot be null, and cannot be reseated.
- Every type has an alignment; the compiler pads structs so each member sits at a multiple of its own alignment and rounds the size up to the struct's alignment. Order members largest-first, never treat a struct as its wire format, and remember that a misaligned access is undefined behavior even where x86 tolerates it. `new` returns 16-byte-aligned memory; `alignas` asks for more.

### Guided Challenges
1. **Watch a frame get recycled.** Write `int* leak_local() { int x = 42; return &x; }` (g++ will warn and, as Pitfall 1 showed, may null the result; defeat that by returning the address through a `volatile int*` global instead). In `main`, call it, then call a different function `void scribble() { int y = 99; (void)y; }`, then print `*p`. Explain, with Diagram 2, why the value you read is `99` and not `42`, and then run the same program under `-fsanitize=address` and read the report's name for the bug.
   **Hint:** both functions have the same call depth from `main`, so their frames begin at the same `%rsp`; where does each one put its single local?
2. **Shrink a struct by reordering, and prove it.** Declare `struct Event { bool ok; double when; std::uint16_t code; char kind; std::uint32_t id; };`, predict `sizeof` and every `offsetof` using the rules in section 2.5 before compiling, then verify with `static_assert` lines. Reorder the members to the smallest legal size (no packing attributes) and verify again. Finally allocate a `std::vector<Event>` of one million elements in both layouts and compare `sizeof(Event) * size()`.
   **Hint:** the answer is 24 bytes before and 16 after; the trick is that the two 2-byte and 1-byte fields can share the tail of one 8-byte slot only if they are adjacent.
