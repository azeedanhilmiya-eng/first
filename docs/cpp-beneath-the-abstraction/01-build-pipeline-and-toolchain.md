# Chapter 1: The Build Pipeline and Toolchain

> Series: C++: From Beginner to Advanced: Beneath the Abstraction
> Standard: C++20 (`-std=c++20`) · Toolchain used for every output below: g++ 13.3 on x86-64 Linux

## 1. Motivation and Mental Model

### Core Problem
C++ must turn human-readable source text into a finished, self-contained file of x86-64 machine code *before* the program ever runs, and it does so with four separate tools whose hand-offs explain almost every "why won't this build?" error you will ever see.

### Analogy / Python-Java Contrast
Think of a book factory. The **Preprocessor (预处理器)** is the paste-up desk: it physically glues every included file into one long manuscript and expands abbreviations. The **Compiler (编译器)** is the translator: it turns that manuscript, one chapter at a time, into the printer's language. The **Assembler (汇编器)** is the typesetter: it converts that text into the actual metal type, bytes, but leaves blank spaces wherever a chapter refers to a page number in a chapter it has not seen. The **Linker (链接器)** is the bookbinder: it stacks all chapters, numbers the pages, and fills in every blank cross-reference. Only then does a book exist.

In Python there is no factory. `import geometry` makes the interpreter read `geometry.py` *while your program is already running*, compile it to bytecode in memory, and put the resulting function objects into a dictionary. A call such as `geometry.distance(a, b)` is a dictionary lookup by string at the moment of the call. A misspelled function name is discovered only when that line executes.

In Java, `javac` produces one `.class` file per class, but linking is deferred: the JVM's class loader locates `Geometry.class` on the classpath the first time it is needed, verifies it, and resolves the symbolic reference `Geometry.distance(DD)D` at run time. A missing class is a `NoClassDefFoundError` thrown by a program that is already running.

In C++ every one of those questions is answered before the **Executable (可执行文件)** exists. The file that comes out of the linker contains raw machine instructions with every cross-reference already patched to a fixed address. There is no interpreter, no class loader, and no runtime lookup by name. When the operating system starts your program it simply maps the file into memory and jumps to the entry point. That is why the build pipeline deserves a whole chapter before we write a single class: the pipeline *is* the runtime that Python and Java hide from you.

## 2. Deep Dive and Low-Level Mechanics

### 2.1 One command, four programs

`g++` is not a compiler. It is a *driver*: a small program that runs the four real tools in sequence and passes each one's output to the next. You can stop the line after any stage:

```text
Diagram 1 — The pipeline behind `g++ -std=c++20 main.cpp geometry.cpp -o main`

   main.cpp ──┐                                                geometry.cpp ──┐
              │  #include, #define, #ifdef                                    │
              ▼                                                               ▼
   ┌──────────────────┐   stop here: -E                          ┌──────────────────┐
   │ 1. PREPROCESSOR  │ ─────────────▶ main.ii (text, 54,148 lines)│ 1. PREPROCESSOR  │
   └────────┬─────────┘                                          └────────┬─────────┘
            ▼                                                             ▼
   ┌──────────────────┐   stop here: -S                          ┌──────────────────┐
   │ 2. COMPILER      │ ─────────────▶ main.s  (assembly text)   │ 2. COMPILER      │
   │    (cc1plus)     │                                          │    (cc1plus)     │
   └────────┬─────────┘                                          └────────┬─────────┘
            ▼                                                             ▼
   ┌──────────────────┐   stop here: -c                          ┌──────────────────┐
   │ 3. ASSEMBLER (as)│ ─────────────▶ main.o  (ELF, relocatable)│ 3. ASSEMBLER (as)│
   └────────┬─────────┘                                          └────────┬─────────┘
            │                                                             │
            └──────────────────────────┬──────────────────────────────────┘
                                       ▼
                          ┌─────────────────────────┐   also reads: libstdc++.so, libc.so, crt1.o ...
                          │ 4. LINKER (collect2/ld) │
                          └────────────┬────────────┘
                                       ▼
                                     main   (ELF, executable, 67,000 bytes)
```

Stages 1–3 run once *per source file* and never look at any other source file. Stage 4 is the only step that sees the whole program. Keep that asymmetry in mind: it is the reason a program can compile perfectly and still fail to build.

### 2.2 Stage 1: Preprocessing — text in, text out

The preprocessor knows nothing about C++. It understands only lines that begin with `#` and it operates on characters. Three directives do almost all of the work:

- `#include "geometry.h"` is replaced by the *entire text* of `geometry.h`, recursively.
- `#define GEO_VERSION_MAJOR 1` teaches it a **Macro (宏)**: from now on every token `GEO_VERSION_MAJOR` is replaced by `1`.
- `#ifndef GEOMETRY_H` / `#endif` keep or discard a region of text depending on whether a macro is defined.

The result is one enormous text file called a **Translation Unit (翻译单元)**: your `.cpp` file plus everything pasted into it. It is the unit of work for the compiler, and nothing outside it exists as far as the compiler is concerned. Here is what happens to the 65-line `main.cpp` of this chapter's example:

```text
$ g++ -std=c++20 -E main.cpp -o main.ii
$ wc -l main.cpp main.ii
     65 main.cpp
  54148 main.ii
```

Sixty-five lines became fifty-four thousand because `<iostream>`, `<vector>`, `<string>` and their dependencies were pasted in. The preprocessor leaves *line markers* so that later error messages can still name the original file:

```text
$ grep -n '^# 1 "' main.ii | head -5
4:# 1 "/usr/include/stdc-predef.h" 1 3 4
6:# 1 "main.cpp"
10:# 1 "geometry.h" 1
12:# 1 "/usr/include/c++/13/cstddef" 1 3
22:# 1 "/usr/include/x86_64-linux-gnu/c++/13/bits/c++config.h" 1 3
```

And the macros are gone. The source line

```cpp
std::cout << geo::kLibraryName << " v" << GEO_VERSION_STRING
```

leaves the preprocessor as

```text
54129:    std::cout << geo::kLibraryName << " v" << "1" "." "2"
```

Three adjacent string literals, which the *compiler* later joins into `"1.2"`. The compiler never sees the word `GEO_VERSION_STRING`; that is why a macro cannot be inspected in a debugger and why a typo inside a macro produces an error message pointing at the place where it was *used*.

**Why headers exist.** The compiler works on one translation unit at a time, so `main.cpp` needs to be *told* what `geo::distance` looks like (its parameter and return types) before it can compile a call to it. A **Header File (头文件)** is nothing more than a text snippet containing those declarations, kept in one place so that every translation unit pastes the same promise. An **Include Guard (头文件保护)** (`#ifndef GEOMETRY_H … #endif`) makes a second paste of the same header expand to nothing, because a `struct` may be *defined* only once per translation unit.

### 2.3 Stage 2: Compilation — one translation unit, blind to all others

Now the real compiler, `cc1plus`, reads the preprocessed text. This is where everything you think of as "C++" happens: parsing, name lookup, type checking, overload resolution, template instantiation, constant evaluation, optimization. Its output is still text, but it is x86-64 assembly:

```text
$ g++ -std=c++20 -S main.cpp -o main.s
$ wc -l main.s
7525 main.s
$ grep -n -A8 '^main:' main.s
1048:main:
1050-	.cfi_startproc
1053-	endbr64
1054-	pushq	%rbp
1057-	movq	%rsp, %rbp
1059-	pushq	%r15
1060-	pushq	%r14
```

Two things in this file matter for the rest of the chapter.

**Compile-time work leaves no trace.** `main.cpp` contains
`static_assert(geo::square(3.0) == 9.0, …)`. Because `square` is `constexpr`, the compiler evaluated `3.0 * 3.0` *while compiling*, checked the assertion, and emitted nothing. This is the first instance of a theme that runs through the whole series: **Compile Time (编译期)** is when the compiler runs on your machine; **Run Time (运行期)** is when the user's CPU executes the result. Work moved to compile time costs the user nothing.

**Calls to other translation units are just names.** Look at how `main.s` calls `Polygon::area()`, which is defined in `geometry.cpp`:

```text
$ grep -n 'call' main.s | grep geo | head -3
769:	call	_ZNK3geo7Polygon4nameEv
794:	call	_ZNK3geo7Polygon12vertex_countEv
818:	call	_ZNK3geo7Polygon4areaEv@PLT
```

The compiler has no idea where `area()` is; it does not even know whether it exists. It emits a call to a *symbolic name* and moves on. Notice the name itself: `_ZNK3geo7Polygon4areaEv`. This is **Name Mangling (名称修饰)**. Because C++ allows the same function name in different namespaces and with different parameter lists (**Function Overloading (函数重载)**, covered in Chapter 2), the compiler encodes the namespace (`3geo`), class (`7Polygon`), function (`4area`), `const`-ness (`K`) and parameter list (`v` = void) into one unique string. The linker, which is a C-era tool that only matches strings, never needs to understand C++ at all. `c++filt` or `nm -C` decode the string back to `geo::Polygon::area() const`.

### 2.4 Stage 3: Assembly — from text to bytes, with holes

The assembler turns each mnemonic into its encoded bytes and writes an **Object File (目标文件)**, `main.o`. It is a real binary file in the **ELF (Executable and Linkable Format) (可执行与可链接格式)** format, but of type `REL`: relocatable, not runnable.

```text
$ g++ -std=c++20 -Wall -Wextra -c main.cpp -o main.o
$ readelf -h main.o | grep -E 'Class|Type|Machine|Entry'
  Class:                             ELF64
  Type:                              REL (Relocatable file)
  Machine:                           Advanced Micro Devices X86-64
  Entry point address:               0x0
```

Entry point zero: nobody can run this file. It is a bag of **Sections (节)**, each holding one kind of bytes, plus two tables describing them:

```text
$ readelf -S -W main.o | grep -E '\.text |\.rela\.text|\.data |\.bss |\.symtab|\.strtab'
  [Nr] Name              Type            Address          Off    Size   ES Flg
  [177] .text             PROGBITS        0000000000000000 000784 0009fa 00  AX
  [178] .rela.text        RELA            0000000000000000 00c490 000c78 18   I
  [179] .data             PROGBITS        0000000000000000 00117e 000000 00  WA
  [180] .bss              NOBITS          0000000000000000 001180 000008 00  WA
```

```text
Diagram 2 — main.o: an object file is code with holes plus a list of the holes

  ┌───────────────────────────────────────────────────────────────────────────┐
  │ ELF header            Type = REL, Machine = x86-64, entry = 0x0           │
  ├───────────────────────────────────────────────────────────────────────────┤
  │ .text   (AX = alloc, execute)   0x9fa bytes of machine code               │
  │   ...                                                                     │
  │   0x214:  e8 00 00 00 00      call  ????        ◀── 4-byte hole           │
  │   0x219:  66 48 0f 7e c0      movq  %xmm0,%rax                            │
  │   ...                                                                     │
  ├───────────────────────────────────────────────────────────────────────────┤
  │ .rela.text  (list of holes)                                               │
  │   offset 0x215  type R_X86_64_PLT32  symbol "geo::Polygon::area() const"  │
  │   offset 0x24d  type R_X86_64_PLT32  symbol "geo::Polygon::perimeter()…"  │
  │   ...                                                                     │
  ├───────────────────────────────────────────────────────────────────────────┤
  │ .data   (WA = alloc, write)     0 bytes: nothing initialized to non-zero  │
  │ .bss    (NOBITS)                8 bytes: (anonymous namespace)::call_count│
  ├───────────────────────────────────────────────────────────────────────────┤
  │ .symtab  what this file DEFINES and what it NEEDS                         │
  │   T main                        defined here, global                      │
  │   b call_count                  defined here, local to this file          │
  │   U geo::Polygon::area() const  NEEDED, defined elsewhere                 │
  │   W geo::Polygon::name() const  defined here, weak (inline; keep one)     │
  └───────────────────────────────────────────────────────────────────────────┘
```

The two tables are the whole story of linking. `.symtab` is the **Symbol Table (符号表)**; each **Symbol (符号)** is a name with a category letter, which `nm` prints:

```text
$ nm -C main.o | grep -E 'geo::|call_count|main$'
0000000000000000 b (anonymous namespace)::call_count
                 U geo::distance_call_count()
                 U geo::Polygon::area() const
                 U geo::Polygon::perimeter() const
0000000000000000 W geo::Polygon::name() const
0000000000000000 W geo::Polygon::vertex_count() const
0000000000000000 u geo::kLibraryName
0000000000000391 T main
```

| Letter | Meaning | Where it came from in our code |
|--------|---------|-------------------------------|
| `T` / `t` | defined in `.text`; upper case = visible to other files, lower = private to this file | `main`; `print_row` (anonymous namespace → `t`) |
| `U` | undefined: used here, must be supplied by some other object file | `geo::Polygon::area() const` |
| `W` | weak: defined here, but duplicates in other files are fine, keep any one | inline member functions defined inside the class body |
| `b` / `B` | zero-initialized data in `.bss` | `call_count` (`b`: private to this file) |
| `u` | GNU "unique" global: one copy program-wide even across shared libraries | `inline constexpr std::string_view kLibraryName` |

`.rela.text` is the **Relocation (重定位)** table. Each entry says: "at this offset inside `.text` there is a hole; when you finally know the address of this symbol, write it here using this formula." You can watch the hole with `objdump -r`:

```text
$ objdump -dr -C --no-show-raw-insn main.o | grep -B1 -A1 'R_X86_64_PLT32.*area'
 214:	call   219 <(anonymous namespace)::print_row(geo::Polygon const&)+0x11a>
			215: R_X86_64_PLT32	geo::Polygon::area() const-0x4
 219:	movq   %xmm0,%rax
```

The `call` at offset `0x214` nominally targets `0x219`, the very next instruction, because its 4-byte displacement field is all zeros. The line beneath it is the relocation: "patch offset `0x215` with the PC-relative distance to `geo::Polygon::area() const`". Nothing in this file can run until every such hole is filled.

### 2.5 Stage 4: Linking — keeping every promise exactly once

The linker reads *all* object files plus the libraries it is told about and does two jobs.

**Job 1: symbol resolution.** For every `U` in every file it searches every other file for a matching `T`, `W` or data symbol. The rules are the **One Definition Rule (单一定义规则)** turned into mechanics:

- zero definitions of a needed symbol → `undefined reference to …` (Pitfall 1);
- two *strong* definitions (`T`) of the same name → `multiple definition of …` (Pitfall 2);
- any number of *weak* definitions (`W`) → keep one, discard the rest. This is how `inline` functions, functions defined inside a class body, and every template instantiation can legally appear in many object files. The compiler places each such definition in its own section with the `G` (group) flag, a *COMDAT group*, so the linker can throw away duplicates wholesale:

```text
$ g++ -std=c++20 -c p2_fix.cpp -o p2f.o && nm p2f.o | grep area
0000000000000000 W _Z4areaRK4Rect
$ readelf -S -W p2f.o | grep area
  [ 6] .text._Z4areaRK4Rect PROGBITS        0000000000000000 0000e4 000023 00 AXG
```

**Job 2: relocation.** Once every symbol has an address, the linker walks each `.rela` table and overwrites the holes. The `call` we watched above now has a real target:

```text
$ g++ main.o geometry.o -o main
$ objdump -d -C --no-show-raw-insn main | grep 'call.*Polygon::area'
    26dd:	call   60b8 <geo::Polygon::area() const>
```

```text
Diagram 3 — Linking: merge sections, assign addresses, fill holes

   main.o                      geometry.o                   main (executable)
  ┌──────────────┐             ┌──────────────┐             ┌───────────────────────────────────────┐
  │ .text        │             │ .text        │             │ .text  (one merged block)             │
  │  main        │             │  distance    │             │  0x285a  main                         │
  │  print_row   │             │  area ◀──────┼── T area    │  0x5ef4  geo::distance                │
  │  call ????───┼── U area ───┼──┘           │             │  0x60b8  Polygon::area                │
  │              │             │  ...         │             │  0x26dd  call 0x60b8   ◀── hole filled│
  └──────────────┘             └──────────────┘             ├───────────────────────────────────────┤
  ┌──────────────┐             ┌──────────────┐             │ .bss                                  │
  │ .bss         │             │ .bss         │             │                                       │
  │  call_count ─┼─────────────┼──────────────┼────────────▶│  0xb158  call_count  (main.o's)       │
  └──────────────┘             │  call_count ─┼────────────▶│  0xb160  call_count  (geometry.o's)   │
                               └──────────────┘             └───────────────────────────────────────┘

   Both object files define a variable named call_count. Both are `b` (local), so the linker
   keeps both and never compares them: internal linkage means "invisible outside this file".
```

```text
$ nm -C main | grep -E 'call_count|geo::distance\(|Polygon::area|T main$'
000000000000b158 b (anonymous namespace)::call_count
000000000000b160 b (anonymous namespace)::call_count
0000000000005ef4 T geo::distance(geo::Point, geo::Point)
00000000000060b8 T geo::Polygon::area() const
000000000000285a T main
```

**Static versus dynamic linking.** Our program also calls `std::cout`, `std::sqrt`, `operator new`. Those live in libraries, and there are two ways to keep that promise:

- A **Static Library (静态库)** (`libfoo.a`) is an archive of object files; the linker copies the needed ones into your executable. The result is self-contained and large.
- A **Shared Library (共享库)** (`libfoo.so`, `.dll` on Windows) is not copied. The linker records only its name and the list of symbols you need; a **Dynamic Loader (动态加载器)** (`ld-linux-x86-64.so.2`) maps the library into your process at start-up and fills in those last holes then. The `@PLT` suffix you saw in `main.s` marks calls that may be resolved this way, through a small jump table called the Procedure Linkage Table.

```text
$ ldd main
	linux-vdso.so.1 (0x00007f1d44c4d000)
	libstdc++.so.6 => /lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007f1d44800000)
	libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f1d44b47000)
	libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007f1d44b19000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f1d44400000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f1d44c4f000)
$ g++ -static main.o geometry.o -o main_static
$ ls -l main main_static | awk '{print $5, $9}'
67000 main
2372320 main_static
$ ldd main_static
	not a dynamic executable
```

The dynamic build is 67 KB and borrows 2 MB of C++ library code that every other C++ program on the machine shares; the static build carries its own copy.

### 2.6 What the linker produced: the anatomy of an executable

The output is still ELF, but now of a runnable type, with a real entry point:

```text
$ readelf -h main | grep -E 'Type|Entry'
  Type:                              DYN (Position-Independent Executable file)
  Entry point address:               0x23e0
```

Two details deserve a pause. The entry point is not `main`; it is `_start`, a few dozen instructions from the C runtime that set up the stack, run global constructors, call `main`, and pass its return value to `exit`. And the type is `DYN`, a **Position-Independent Executable (位置无关可执行文件)**: the addresses inside are offsets from wherever the kernel decides to load the file, which lets the OS randomize the load address on every run (a security feature you will meet again in Chapter 3).

For running, the OS does not care about the fine-grained sections; it cares about **Segments (段)**, the coarse blocks that must be mapped into memory with particular permissions. `readelf -l` shows the `LOAD` segments and which sections were packed into each:

```text
$ readelf -l -W main | grep LOAD
  LOAD  0x000000 0x0000000000000000 ... FileSiz 0x001f70 MemSiz 0x001f70 R   0x1000
  LOAD  0x002000 0x0000000000002000 ... FileSiz 0x004601 MemSiz 0x004601 R E 0x1000
  LOAD  0x007000 0x0000000000007000 ... FileSiz 0x002355 MemSiz 0x002355 R   0x1000
  LOAD  0x009c70 0x000000000000ac70 ... FileSiz 0x0003a8 MemSiz 0x0004f8 RW  0x1000
```

```text
Diagram 4 — ELF executable on disk, and how the loader maps it (x86-64 Linux, g++ 13 default PIE)

   FILE (main, 67,000 bytes)                     PROCESS MEMORY (after execve)
  ┌─────────────────────────────┐                ┌──────────────────────────────┐ higher addresses
  │ ELF header  (64 bytes)      │                │ stack, shared libs, heap ... │  (Chapter 3)
  │   e_type = DYN, e_entry     │                ├──────────────────────────────┤
  ├─────────────────────────────┤                │ RW  segment                  │
  │ Program headers (LOAD x4 …) │──describes────▶│   .data   928 bytes  (init'd)│
  ├─────────────────────────────┤                │   .bss    296 bytes  ZERO-   │◀─ not in the file:
  │ .interp  "/lib64/ld-linux…" │                │           FILLED by loader   │   MemSiz > FileSiz
  │ .dynsym / .dynstr / .rela.* │  R segment     ├──────────────────────────────┤
  ├─────────────────────────────┤                │ R   segment  .rodata,.eh_frame│  "polygon", "1.2", …
  │ .plt / .text  (machine code)│  R E segment ─▶│ R E segment  .text  = the    │
  │   _start @0x23e0            │                │    Text Segment (代码段)      │◀─ execute, never write
  │   main   @0x285a            │                ├──────────────────────────────┤
  ├─────────────────────────────┤                │ R   segment  headers, .dynsym │
  │ .rodata  string literals    │  R segment     └──────────────────────────────┘ base chosen by kernel
  ├─────────────────────────────┤
  │ .data    initialized globals│  RW segment
  ├─────────────────────────────┤
  │ .symtab / .strtab (debug    │  NOT loaded: nm reads these, the CPU never does
  │   aid; `strip` removes them)│
  ├─────────────────────────────┤
  │ Section headers             │
  └─────────────────────────────┘
```

Three of the names in that diagram are the classic memory regions you will use for the rest of the series. The **Text Segment (代码段)** holds instructions and is mapped read-only and executable. The **Data Segment (数据段)** holds globals whose initial value is not zero and must therefore be stored in the file. The **BSS Segment (未初始化数据段)** holds zero-initialized globals such as our two `call_count` variables: the file records only their *size* (`NOBITS`), and the loader hands out fresh zeroed pages. That is why the last `LOAD` line has `MemSiz` larger than `FileSiz`: the difference is BSS.

**And on Windows?** The same design wears a different coat. A Windows executable or DLL uses the **PE (Portable Executable) (可移植可执行文件格式)** format: a legacy DOS header, a PE header, and sections named `.text`, `.rdata`, `.data`, `.bss` with the same roles, plus an *import table* that plays the part of ELF's dynamic symbol table. MSVC's linker `link.exe` does exactly what `ld` does; only the file layout, the name-mangling scheme and the **Calling Convention (调用约定)** differ, which is why object files from MSVC and g++ cannot be mixed.

### 2.7 The flags that change what the pipeline does

Every flag on the `g++` command line is a knob on one of the four stages.

| Flag | Stage it changes | What it does |
|------|------------------|--------------|
| `-std=c++20` | compiler | selects the language standard. Without it g++ 13 defaults to `gnu++17` (Pitfall 4). |
| `-Wall` | compiler | turns on the warnings that are almost always bugs (sign comparisons, unused variables, missing `return`…). It is *not* "all warnings". |
| `-Wextra` | compiler | a second tier (unused parameters, sign comparisons in more places, missing field initializers…). |
| `-Wpedantic` | compiler | reject GNU extensions that are not standard C++. |
| `-Werror` | compiler | promote every warning to an error, so nobody can ignore them. |
| `-O0` / `-O2` / `-O3` | compiler | how hard to optimize. `-O0` (the default) keeps code close to the source for debugging. |
| `-g` | compiler + assembler | emit debug tables so `gdb` can map addresses back to lines and variables. |
| `-c` / `-S` / `-E` | driver | stop after assembling / compiling / preprocessing. |
| `-I dir` | preprocessor | an extra directory to search for `#include`. |
| `-l foo` / `-L dir` | linker | link against `libfoo.so` or `libfoo.a`, searched in `dir`. |
| `-static` | linker | copy library code into the executable instead of referencing `.so` files. |
| `-fsanitize=address,undefined` | compiler + linker | instrument the code to catch memory errors and undefined behavior at run time (used heavily from Chapter 3 onward). |

The difference the warnings make is not cosmetic. This program compiles silently by default and prints "weird":

```cpp
int main() { unsigned u = 3; int s = -1; if (s < u) std::cout << "weird\n"; }
```

```text
$ g++ -std=c++20 -c w.cpp            # no output at all
$ g++ -std=c++20 -Wall -Wextra -c w.cpp
w.cpp:3:48: warning: comparison of integer expressions of different signedness: 'int' and 'unsigned int' [-Wsign-compare]
```

(Chapter 2 explains why `-1 < 3u` is false.) Always build with `-Wall -Wextra`; the series' `verify.sh` adds `-Wpedantic -Werror` on top.

Optimization is the flag with the most visible effect on the bytes. Compiling `geometry.cpp` twice:

```text
$ g++ -std=c++20 -O0 -c geometry.cpp -o g0.o && g++ -std=c++20 -O2 -c geometry.cpp -o g2.o
$ size g0.o g2.o
   text	   data	    bss	    dec	    hex	filename
   6188	     8	      8	   6204	   183c	g0.o
   1143	     8	      8	   1159	    487	g2.o
```

Five times less code, because at `-O2` the compiler inlined `square`, `cross`, and the `std::vector` accessors instead of calling them (98 `call` instructions became 9). Here is the entire `geo::distance` at `-O2`:

```text
$ objdump -d -C --no-show-raw-insn g2.o    # excerpt
0000000000000000 <geo::distance(geo::Point, geo::Point)>:
   0:	endbr64
   4:	subsd  %xmm0,%xmm2            ; b.x - a.x
   8:	subsd  %xmm1,%xmm3            ; b.y - a.y
   c:	addq   $0x1,0x0(%rip)         ; ++call_count  (0x0 = a hole: .bss address unknown until link)
  14:	mulsd  %xmm3,%xmm3            ; dy*dy
  18:	mulsd  %xmm2,%xmm2            ; dx*dx
  1c:	addsd  %xmm3,%xmm2
  20:	movapd %xmm2,%xmm0
  24:	sqrtsd %xmm0,%xmm0            ; std::sqrt became one instruction
  28:	ret
```

Ten instructions; no function calls at all; `std::sqrt` became the CPU's `sqrtsd`. Even here the pipeline shows through: the increment of `call_count` addresses `0x0(%rip)` because, inside a single object file, the compiler still does not know how far `.bss` will end up from `.text`. That displacement is one more relocation for the linker.

### 2.8 The full timeline: what happens when

```text
Diagram 5 — Compile time versus run time for this chapter's program

 BUILD MACHINE (once, by the developer)
 ─────────────────────────────────────────────────────────────────────────────────────
  preprocess    paste headers, expand GEO_VERSION_STRING → "1" "." "2", drop #ifndef'd text
  compile       type-check; resolve overloads; evaluate static_assert(square(3.0) == 9.0);
                choose registers; emit `call _ZNK3geo7Polygon4areaEv@PLT` (a name, not an address)
  assemble      encode bytes; record holes in .rela.text; list needs (U) and offers (T/W) in .symtab
  link          match every U to exactly one T/W; discard duplicate W; assign addresses;
                overwrite holes; write ELF with entry point _start; note libstdc++.so.6 as needed
 ─────────────────────────────────────────────────────────────────────────────────────
 USER MACHINE (every run)
 ─────────────────────────────────────────────────────────────────────────────────────
  execve()      kernel reads program headers, maps R / R E / RW segments, zero-fills .bss,
                picks a random base address, maps ld-linux, jumps to it
  ld-linux      maps libstdc++.so.6, libm, libc; patches the PLT/GOT holes for shared symbols
  _start        C runtime: set up stack, run global constructors (std::cout is initialized here)
  main          finally, your first line executes
  exit          run global destructors, flush std::cout, return status to the shell
```

Everything above the line was decided before the user's CPU ran a single instruction of your code. Python and Java perform the equivalents of "preprocess", "compile", and a good part of "link" *below* the line, every time, which is exactly the overhead C++ trades away in exchange for making you run the factory yourself.

## 3. Complete, Production-Grade Code Example

A three-file program: a header that declares a small geometry library, a source file that implements it, and a `main.cpp` that uses it. It is deliberately built to expose the pipeline: a macro that only the preprocessor sees, a `static_assert` that only the compiler sees, functions that only the linker can connect, and two different variables with the same name in two translation units.

**`examples/ch01/geometry.h`**
```cpp
// geometry.h -- the public interface of a tiny geometry "library".
//
// A header is never compiled on its own. The preprocessor pastes it, as text,
// into every translation unit that #includes it, so everything here must be
// safe to appear in MANY object files at once: declarations, class definitions,
// and inline/constexpr definitions. Out-of-line definitions live in geometry.cpp.
#ifndef GEOMETRY_H  // include guard: a second #include in the same TU sees this as false
#define GEOMETRY_H

#include <cstddef>
#include <string>
#include <string_view>
#include <vector>

// Preprocessor-only machinery. These names vanish before the compiler runs:
// GEO_VERSION_STRING becomes the three adjacent literals "1" "." "2".
#define GEO_VERSION_MAJOR 1
#define GEO_VERSION_MINOR 2
#define GEO_STRINGIFY_(x) #x                // turns a token into "token"
#define GEO_STRINGIFY(x) GEO_STRINGIFY_(x)  // extra layer so x is macro-expanded first
#define GEO_VERSION_STRING \
    GEO_STRINGIFY(GEO_VERSION_MAJOR) "." GEO_STRINGIFY(GEO_VERSION_MINOR)

namespace geo {

struct Point {
    double x;
    double y;
};

// Declared here, DEFINED in geometry.cpp. Every other translation unit that
// calls it compiles to a reference to an *undefined* symbol that only the
// linker can resolve.
[[nodiscard]] double distance(Point a, Point b) noexcept;

// How many times distance() has run. The counter itself lives in geometry.cpp.
[[nodiscard]] std::size_t distance_call_count() noexcept;

// constexpr functions are implicitly inline: this definition may legally appear
// in every translation unit, and the compiler can evaluate it at compile time.
[[nodiscard]] constexpr double square(double v) noexcept { return v * v; }

// C++17 inline variable: one object shared by all translation units.
inline constexpr std::string_view kLibraryName = "geometry";

class Polygon {
public:
    // Requires at least three vertices; throws std::invalid_argument otherwise.
    Polygon(std::string name, std::vector<Point> vertices);

    // Defined inside the class body => implicitly inline. Each TU that calls
    // one of these may emit its own copy as a *weak* symbol; the linker keeps one.
    [[nodiscard]] std::string_view name() const noexcept { return name_; }
    [[nodiscard]] std::size_t vertex_count() const noexcept { return vertices_.size(); }

    // Declared here, defined out-of-line in geometry.cpp (strong symbols).
    [[nodiscard]] double area() const noexcept;
    [[nodiscard]] double perimeter() const noexcept;

private:
    std::string name_;
    std::vector<Point> vertices_;
};

}  // namespace geo

#endif  // GEOMETRY_H
```

**`examples/ch01/geometry.cpp`**
```cpp
// geometry.cpp -- ONE translation unit: this file plus everything it #includes.
//
// Compiling it alone (g++ -c geometry.cpp) produces geometry.o, which holds
// machine code only for the functions defined here and knows nothing about
// main.cpp. The two object files meet for the first time inside the linker.
#include "geometry.h"

#include <cmath>
#include <cstddef>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace {

// Internal linkage: visible only inside THIS translation unit. main.cpp has a
// variable with exactly the same name; the linker never sees either of them.
std::size_t call_count = 0;

// One term of the shoelace formula. Also internal linkage.
[[nodiscard]] double cross(geo::Point a, geo::Point b) noexcept {
    return a.x * b.y - a.y * b.x;
}

}  // namespace

namespace geo {

double distance(Point a, Point b) noexcept {
    ++call_count;
    return std::sqrt(square(b.x - a.x) + square(b.y - a.y));
}

std::size_t distance_call_count() noexcept { return call_count; }

Polygon::Polygon(std::string name, std::vector<Point> vertices)
    : name_(std::move(name)), vertices_(std::move(vertices)) {
    if (vertices_.size() < 3) {
        throw std::invalid_argument("Polygon needs at least three vertices");
    }
}

double Polygon::area() const noexcept {
    double twice_area = 0.0;
    for (std::size_t i = 0; i < vertices_.size(); ++i) {
        const Point& current = vertices_[i];
        const Point& next = vertices_[(i + 1) % vertices_.size()];  // wraps to vertex 0
        twice_area += cross(current, next);
    }
    return std::abs(twice_area) / 2.0;
}

double Polygon::perimeter() const noexcept {
    double total = 0.0;
    for (std::size_t i = 0; i < vertices_.size(); ++i) {
        total += distance(vertices_[i], vertices_[(i + 1) % vertices_.size()]);
    }
    return total;
}

}  // namespace geo
```

**`examples/ch01/main.cpp`**
```cpp
// main.cpp -- the second translation unit. It sees geometry.h (the interface)
// and never geometry.cpp. Every call into geo::distance or geo::Polygon::area
// is compiled as a call to a symbol that main.o cannot resolve by itself.
#include "geometry.h"

#include <cstddef>
#include <iomanip>
#include <iostream>
#include <string_view>
#include <vector>

// Checked by the COMPILER while translating this file. It costs nothing at
// run time and leaves no trace in main.o.
static_assert(geo::square(3.0) == 9.0, "constexpr functions are evaluated at compile time");

namespace {

// Same name as the counter in geometry.cpp, yet a *different* variable:
// anonymous-namespace names have internal linkage, one per translation unit.
std::size_t call_count = 0;

void print_header() {
    std::cout << std::left << std::setw(15) << "polygon" << std::right << std::setw(3) << "n"
              << std::setw(10) << "area" << std::setw(12) << "perimeter" << '\n';
}

void print_row(const geo::Polygon& p) {
    ++call_count;
    std::cout << std::left << std::setw(15) << p.name() << std::right << std::setw(3)
              << p.vertex_count() << std::fixed << std::setprecision(3) << std::setw(10)
              << p.area() << std::setw(12) << p.perimeter() << '\n';
}

// Regular hexagon with side 1. The vertex coordinates are compile-time
// constants, so no trigonometry runs at run time.
std::vector<geo::Point> unit_hexagon() {
    constexpr double h = 0.86602540378443864676;  // sqrt(3) / 2
    return {{1.0, 0.0}, {0.5, h}, {-0.5, h}, {-1.0, 0.0}, {-0.5, -h}, {0.5, -h}};
}

}  // namespace

int main() {
    // GEO_VERSION_STRING and __cplusplus are replaced by the PREPROCESSOR; the
    // compiler only ever sees the literals "1" "." "2" and 202002L.
    std::cout << geo::kLibraryName << " v" << GEO_VERSION_STRING
              << " (__cplusplus = " << __cplusplus << ")\n";

    const std::vector<geo::Polygon> shapes = {
        geo::Polygon("unit-square", {{0.0, 0.0}, {1.0, 0.0}, {1.0, 1.0}, {0.0, 1.0}}),
        geo::Polygon("right-triangle", {{0.0, 0.0}, {4.0, 0.0}, {0.0, 3.0}}),
        geo::Polygon("unit-hexagon", unit_hexagon()),
    };

    print_header();
    for (const geo::Polygon& p : shapes) {
        print_row(p);
    }

    // Two counters, one name, two translation units.
    std::cout << "distance() calls counted inside geometry.cpp: " << geo::distance_call_count()
              << '\n';
    std::cout << "rows printed, counted inside main.cpp:        " << call_count << '\n';
    return 0;
}
```

**Build and run:**
```text
$ g++ -std=c++20 -Wall -Wextra main.cpp geometry.cpp -o main
$ ./main
```
**Terminal Output:**
```text
geometry v1.2 (__cplusplus = 202002)
polygon          n      area   perimeter
unit-square      4     1.000       4.000
right-triangle   3     6.000      12.000
unit-hexagon     6     2.598       6.000
distance() calls counted inside geometry.cpp: 13
rows printed, counted inside main.cpp:        3
```

Reading the output against the pipeline: the first line shows text that the *preprocessor* assembled (`"1" "." "2"` and `202002L`). The table comes from calls that `main.o` could only name and the *linker* connected to `geometry.o`. The last two lines are the proof that the two `call_count` variables are distinct objects: `perimeter()` calls `distance()` once per edge (4 + 3 + 6 = 13) and only `geometry.cpp`'s counter sees them, while `main.cpp`'s counter sees only its own three `print_row` calls. You can build the same program in the explicit four-step form and get a byte-identical result:

```text
$ g++ -std=c++20 -Wall -Wextra -c main.cpp -o main.o        # stages 1–3 for main.cpp
$ g++ -std=c++20 -Wall -Wextra -c geometry.cpp -o geometry.o  # stages 1–3 for geometry.cpp
$ g++ main.o geometry.o -o main                              # stage 4 only
```

Large projects always work this way, through `make`, CMake, or Ninja, because a change to `geometry.cpp` then requires re-running stages 1–3 for that one file plus a relink, not a rebuild of everything.

## 4. Pitfalls and Anti-Patterns

### Pitfall 1: "I declared it, why can't the compiler find it?" — the undefined reference
**Buggy Snippet:**
```cpp
namespace geo {
struct Point { double x; double y; };
double distance(Point a, Point b) noexcept;   // declaration only; definition is in geometry.cpp
}

int main() {
    const geo::Point origin{0.0, 0.0};
    const geo::Point corner{3.0, 4.0};
    std::cout << "distance = " << geo::distance(origin, corner) << '\n';
}
```
```text
$ g++ -std=c++20 -Wall -Wextra p1_bug.cpp -o p1_bug      # geometry.cpp forgotten
```
**Symptom / Compiler Diagnostic:**
```text
/usr/bin/ld: /tmp/cc4MgVxV.o: in function `main':
p1_bug.cpp:(.text+0x81): undefined reference to `geo::distance(geo::Point, geo::Point)'
collect2: error: ld returned 1 exit status
```
**Underlying Cause:** The message comes from `ld`, not from the compiler, and that tells you which stage failed. The compiler accepted the declaration as a promise, emitted a `call` with a 4-byte hole, and wrote `U geo::distance(geo::Point, geo::Point)` into the symbol table of the object file. The linker then searched every object file and library it was given for a `T` with that exact mangled name and found none, because `geometry.cpp` was never compiled and never handed to it. Nothing in the code is wrong; the *set of inputs to stage 4* is wrong. The same error appears when the definition exists but its signature differs (a `const` or a parameter type off by one), because then the mangled names differ and, to the linker, those are unrelated strings.

**Fix:**
```text
$ g++ -std=c++20 -Wall -Wextra main.cpp geometry.cpp -o main    # give the linker the definition
```
or, in a single-file program, keep the promise yourself:
```cpp
double distance(Point a, Point b) noexcept {   // definition: signature identical to the declaration
    const double dx = b.x - a.x;
    const double dy = b.y - a.y;
    return std::sqrt(dx * dx + dy * dy);
}
```

### Pitfall 2: A function *defined* in a header — multiple definition
**Buggy Snippet:**
```cpp
// p2_shapes.h
#ifndef P2_SHAPES_H
#define P2_SHAPES_H
struct Rect { double w; double h; };
double area(const Rect& r) { return r.w * r.h; }   // a DEFINITION, pasted into every includer
#endif

// p2_bug.cpp            // p2_bug_report.cpp
#include "p2_shapes.h"   // #include "p2_shapes.h"
int main() { ... }       // double doubled_area(const Rect& r) { return 2.0 * area(r); }
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p2_bug.cpp p2_bug_report.cpp -o p2_bug
/usr/bin/ld: /tmp/ccFtJuZG.o: in function `area(Rect const&)':
p2_bug_report.cpp:(.text+0x0): multiple definition of `area(Rect const&)'; /tmp/ccyRKuNL.o:p2_bug.cpp:(.text+0x0): first defined here
collect2: error: ld returned 1 exit status
```
**Underlying Cause:** Each `.cpp` file compiles in isolation and each one sees a complete copy of `area` in its translation unit, so each object file contains a full, *strong* (`T`) definition of `_Z4areaRK4Rect`. The include guard does not help: it prevents two pastes into the *same* translation unit, not into two different ones. When the linker meets two strong symbols with one name it has no rule for choosing, so the One Definition Rule is enforced with an error. Note that the program builds fine while there is only one `.cpp` file; the bug appears the day a second file includes the header.

**Fix:**
```cpp
inline double area(const Rect& r) { return r.w * r.h; }   // weak symbol in a COMDAT group; linker keeps one
```
`inline` here is a *linkage* instruction, "identical copies may exist in many object files", not a request to inline the machine code. Alternatives: declare in the header and define in exactly one `.cpp`, or make it `constexpr` (which implies `inline`).

### Pitfall 3: A header without an include guard — redefinition
**Buggy Snippet:**
```cpp
// p3_point.h  (no guard)
struct Point { double x; double y; };

// p3_segment.h
#ifndef P3_SEGMENT_H
#define P3_SEGMENT_H
#include "p3_point.h"
struct Segment { Point from; Point to; };
#endif

// p3_bug.cpp
#include "p3_point.h"     // Point pasted once ...
#include "p3_segment.h"   // ... and again, through p3_segment.h
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3_bug
In file included from p3_segment.h:5,
                 from p3_bug.cpp:10:
p3_point.h:2:8: error: redefinition of 'struct Point'
    2 | struct Point {
      |        ^~~~~
In file included from p3_bug.cpp:9:
p3_point.h:2:8: note: previous definition of 'struct Point'
```
**Underlying Cause:** This one is a *compiler* error, and the "In file included from" chain is the preprocessor's line markers being read back to you. After preprocessing, the translation unit literally contains the text `struct Point { … };` twice, once at line 9's paste and once inside line 10's paste. A class may be defined once per translation unit (the compiler needs a single layout for it), so the second copy is rejected. The header is not broken by itself; it is broken as soon as two paths lead to it, which in any real project is always.

**Fix:**
```cpp
// p3_point_fixed.h
#ifndef P3_POINT_FIXED_H   // first paste: macro undefined, keep the body
#define P3_POINT_FIXED_H   // ... and define it for the rest of this translation unit
struct Point { double x; double y; };
#endif                     // second paste: macro defined, everything above is discarded
```
`#pragma once` at the top of the file does the same job in one line and is supported by g++, clang++ and MSVC, though it is not part of the standard.

### Pitfall 4: Forgetting `-std=c++20` — "`span` is not a member of `std`"
**Buggy Snippet:**
```cpp
#include <span>
#include <vector>

double sum(std::span<const double> values) {   // std::span exists only since C++20
    double total = 0.0;
    for (double v : values) total += v;
    return total;
}
```
```text
$ g++ -Wall -Wextra p4_bug.cpp -o p4_bug         # no -std flag
```
**Symptom / Compiler Diagnostic:**
```text
p4_bug.cpp:13:17: error: 'span' is not a member of 'std'
   13 | double sum(std::span<const double> values) {
      |                 ^~~~
p4_bug.cpp:13:17: note: 'std::span' is only available from C++20 onwards
p4_bug.cpp:13:22: error: expected primary-expression before 'const'
p4_bug.cpp: In function 'int main()':
p4_bug.cpp:23:39: error: 'sum' cannot be used as a function
```
**Underlying Cause:** g++ 13 compiles as `gnu++17` unless told otherwise (`g++ -dM -E -x c++ /dev/null | grep __cplusplus` prints `201703L`). The standard library headers are shared between all language versions and hide every C++20 name behind `#if __cplusplus >= 202002L`, so the preprocessor *discarded* the definition of `std::span` before the compiler ever saw it. The first error is the real one; the next two are the compiler trying to make sense of a function whose parameter type does not exist. Reading only the last error would send you looking at `main`.

**Fix:**
```text
$ g++ -std=c++20 -Wall -Wextra p4_fix.cpp -o p4_fix
```
and, so the next person gets one clear message instead of a cascade:
```cpp
static_assert(__cplusplus >= 202002L, "this file requires -std=c++20 or newer");
```

## 5. Summary and Self-Assessment

### Core Takeaways
- `g++` drives four tools. The preprocessor pastes text (`-E`), the compiler translates one translation unit at a time and knows nothing about the others (`-S`), the assembler produces a relocatable ELF object with symbol and relocation tables (`-c`), and only the linker sees the whole program and fills in every cross-file address.
- An object file is code with holes. `nm` lists what it defines (`T`, `W`, `b`) and needs (`U`); `.rela.text` lists where the holes are. Linker errors, `undefined reference` and `multiple definition`, are the One Definition Rule enforced on those tables, and they mention `ld`, which tells you the code compiled fine and the *inputs to the link* are wrong.
- Headers are pasted declarations, so every header needs an include guard (one paste per translation unit) and every function *defined* in a header needs `inline` or `constexpr` (one surviving copy across translation units). Name mangling is how the C-era linker tells `geo::distance(Point, Point)` from every other `distance`.
- The executable's `.text`, `.data` and `.bss` sections become the read-only-executable, read-write, and zero-filled memory regions of the running process; nothing is resolved by name at run time. Build with `-std=c++20 -Wall -Wextra` always; g++ 13 defaults to `gnu++17` and to `-O0`.

### Guided Challenges
1. **Find the missing definition with `nm`.** Split the example into a third file, `report.cpp`, that defines a function `void print_summary(const geo::Polygon&)` declared in `geometry.h`, then build with `g++ main.cpp geometry.cpp -o main` and watch it fail. Before adding `report.cpp` to the command line, prove *which* object file is at fault using only `g++ -c` and `nm -C … | grep ' [TU] '` on each object.
   **Hint:** an undefined reference names a symbol that appears as `U` in at least one object file and as `T` in none of the files you handed to the linker.
2. **`inline` versus inlining.** Put `inline double half(double v) { return v / 2; }` in a header, call it from two `.cpp` files, and compile both at `-O0` and then at `-O2`. Use `nm -C` on each object file to see whether the symbol `half(double)` still exists, and `objdump -d` to see whether any `call` to it remains.
   **Hint:** `inline` decides how the *linker* treats duplicate definitions (a `W` symbol); whether the *compiler* copies the body into the caller is an unrelated decision made by the optimizer, and at `-O2` an unreferenced weak function may vanish from the object file entirely.
