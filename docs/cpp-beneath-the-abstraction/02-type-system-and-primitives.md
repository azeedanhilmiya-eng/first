# Chapter 2: Type System and Low-Level Primitives

> Series: C++: From Beginner to Advanced: Beneath the Abstraction
> Standard: C++20 (`-std=c++20`) · Toolchain used for every output below: g++ 13.3 on x86-64 Linux

## 1. Motivation and Mental Model

### Core Problem
A C++ type is a compile-time contract that tells the **Compiler (编译器)** exactly how many bytes an object occupies, how to interpret those bits, and which machine instruction to emit for each operation — so that at **Run Time (运行期)** nothing but the raw bits remains, and every misunderstanding of that contract becomes silent corruption, a crash, or **Undefined Behavior (未定义行为)** instead of an exception.

### Analogy / Python-Java Contrast

Think of a shipping container yard. In Python and Java, every container carries a manifest stapled to its door: what is inside, how big it is, who is allowed to open it. Any worker can walk up to any container at any time, read the manifest, and act correctly. That manifest costs space (it is bolted to every single container) and time (every operation starts by reading it).

C++ throws the manifests away before the ship leaves port. The compiler reads all of them once, writes a loading plan — "slot 12 holds four bytes to be treated as a signed 32-bit integer; slot 16 holds eight bytes that are an IEEE-754 double" — and then compiles that plan directly into the crane's motions. At run time the containers are anonymous boxes of bits. The crane never checks; it just does what the plan says. If the plan is right, this is as fast as the hardware can go. If you lie to the plan — tell it a box of doubles is a box of pointers — the crane will happily do the wrong thing at full speed.

Concretely, the integer `7`:

- **Python (CPython 3.11):** `a = 7` makes `a` a reference to a `PyLongObject` on the heap. `sys.getsizeof(7)` reports **28 bytes**: a **Reference Count (引用计数)** (8), a pointer to `PyLong_Type` (8), a signed digit count `ob_size` (8), and one 30-bit digit (4). Every `a + 1` starts by following `ob_type` to find out what "+" means for this object.
- **Java (HotSpot):** a primitive `int a = 7` is a 4-byte slot in the frame, with the type fixed by the bytecode verifier at load time — closer to C++. But the moment it enters a collection it is boxed into an `Integer`: a 12-byte object header (mark word + compressed class pointer) plus 4 bytes of value, 16 bytes total, managed by **Garbage Collection (垃圾回收)**. `int` is always 32 bits and always wraps on overflow, by specification, on every platform.
- **C++:** `int a = 7;` is four bytes, `07 00 00 00`, and nothing else. There is no header, no type pointer, no run-time tag. `sizeof(int)` is not even fixed by the language — it is **Implementation-Defined Behavior (实现定义行为)**, and on this toolchain it is 4. The type `int` exists only in the compiler's symbol table; after compilation it survives solely as the *choice of instructions* (`add`, `imul`, `cvtsi2sd`, `setl`) that were emitted for it.

That last point is the whole chapter. Every topic below — sizes, overflow, promotion, value categories, casts, overloading, mangling — is a place where the compile-time contract and the run-time bits are easy to confuse, and where Python/Java intuition points the wrong way.

## 2. Deep Dive and Low-Level Mechanics

Throughout this section, "compile time" means: decided by g++ while reading your source, encoded into the chosen instructions and symbol names, and gone by the time `./main` starts. "Run time" means: happens on the CPU, on the actual bits, with no memory of what the source said.

### 2.1 What a type is: size, alignment, interpretation, permitted operations

To the compiler a type is a four-part contract: (1) `sizeof(T)` bytes, (2) an alignment requirement (Chapter 3), (3) a rule for reading those bytes as a value, and (4) the set of operations it will accept and the instruction it will emit for each. None of the four exists at run time.

```
Diagram 1 — the value 7 as three runtimes store it (64-bit builds)

CPython 3.11:  a = 7                Java HotSpot:  Integer a = 7        C++:  int a = 7;
a ──▶ PyLongObject (28 bytes)        a ──▶ Integer object (16 bytes)      a: ┌────┬────┬────┬────┐
      ┌───────────────┐ +0                ┌───────────────┐ +0              │ 07 │ 00 │ 00 │ 00 │
      │ ob_refcnt   8 │                   │ mark word   8 │                  └────┴────┴────┴────┘
      ├───────────────┤ +8                ├───────────────┤ +8               4 bytes, no header,
      │ ob_type     8 │──▶ PyLong_Type    │ class ptr   4 │──▶ Integer.class no run-time type tag.
      ├───────────────┤ +16               ├───────────────┤ +12              "int" survives only as
      │ ob_size     8 │                   │ value       4 │ = 7              the instructions chosen
      ├───────────────┤ +24               └───────────────┘                  for it: add, imul, setl...
      │ ob_digit[0] 4 │ = 7
      └───────────────┘
      + the 8-byte reference `a`         + the 4/8-byte reference `a`
```

Python asks "what are you?" on every operation; Java asks once at class-load and once more at every virtual call; C++ asked once, at compile time, and then forgot. Keep this picture in mind when a later section says "the compiler *decided*": it means the decision is baked into the instruction stream, and no amount of run-time cleverness can revisit it.

### 2.2 Sizes: `sizeof`, the LP64 data model, and fixed-width types

The C++ standard guarantees remarkably little about sizes: `sizeof(char) == 1` by definition (a `char` is one byte, and a byte is `CHAR_BIT` bits — 8 here), and the chain `1 == sizeof(char) <= sizeof(short) <= sizeof(int) <= sizeof(long) <= sizeof(long long)`. Beyond minimum ranges (`int` must hold at least ±32767), everything else is implementation-defined. What fixes the sizes on a given platform is the **ABI (Application Binary Interface) (应用二进制接口)** — for us, the System V x86-64 ABI with the "LP64" data model: **L**ong and **P**ointers are **64**-bit, `int` stays 32. The main example in section 3 prints the actual numbers; here is the same table with the guarantee next to the fact:

```
Diagram 2 — fundamental types on x86-64 Linux (LP64), one box = one byte

 type          sizeof  layout                        language guarantee / note
 ────────────  ──────  ────────────────────────────  ─────────────────────────────────────────
 bool             1    [ ]                           size implementation-defined; 1 on g++
 char             1    [ ]                           exactly one byte, CHAR_BIT == 8 bits here
 short            2    [ ][ ]                        at least 16 bits
 int              4    [ ][ ][ ][ ]                  at least 16 bits (!) — 32 on every ABI you will meet
 long             8    [ ][ ][ ][ ][ ][ ][ ][ ]      at least 32 bits;  4 bytes on Windows (LLP64)
 long long        8    [ ][ ][ ][ ][ ][ ][ ][ ]      at least 64 bits
 float            4    [ ][ ][ ][ ]                  IEEE-754 binary32 on this ABI
 double           8    [ ][ ][ ][ ][ ][ ][ ][ ]      IEEE-754 binary64 on this ABI
 long double     16    [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ] + 6 pad   x87 80-bit value, padded to 16 for alignment
 T*               8    [ ][ ][ ][ ][ ][ ][ ][ ]      a 64-bit virtual address (Chapter 3)
 std::size_t      8    [ ][ ][ ][ ][ ][ ][ ][ ]      unsigned; the type of sizeof and of .size()
```

Two consequences a Java developer must internalize:

1. **`long` is not "the 64-bit type".** It is 8 bytes here and 4 bytes on 64-bit Windows. Code that stores a file offset or a hash in `long` is portable in Java and silently wrong in C++. When you need a width, say so: `<cstdint>` gives `std::int8_t`, `std::int16_t`, `std::int32_t`, `std::int64_t` and their `uint` twins, which are exact by definition (the `static_assert(sizeof(std::int32_t) == 4)` in the example is redundant *on purpose*: it documents the guarantee).
2. **Fixed-width types are aliases, not new types.** On glibc/x86-64, `std::int32_t` *is* `int`, `std::int64_t` *is* `long` (not `long long`), and `std::uint8_t` *is* `unsigned char`. That last one bites immediately: `std::cout << std::uint8_t{44}` prints `,` because **Overload Resolution (重载决议)** — section 2.8 — sees an `unsigned char` and picks the character-printing overload. The example prints exactly that.

The compiler evaluates `sizeof` as a **Constant Expression (常量表达式)**: no code is generated for it, which is why it can appear in `static_assert` and in array bounds. `std::numeric_limits<int>::min()`/`max()` are likewise pure compile-time facts. Note also that `sizeof(a + b)` in section 5 of the example reports **4** although `a` and `b` are one-byte objects — the operand is never evaluated; only its *type* is inspected, and that type is `int` for reasons section 2.5 explains.

### 2.3 Two's complement: what the bits mean, and where the CPU stops caring

Since C++20 the standard mandates **Two's Complement (补码)** for **Signed (有符号)** integers (earlier standards allowed sign-magnitude and ones' complement machines; none you will ever program). The rule is simple: the most significant bit has a *negative* weight; every other bit is exactly what it is in the **Unsigned (无符号)** reading.

```
Diagram 3 — one byte, two readings (int8_t vs uint8_t); C++20 requires two's complement

 bit index         7     6     5     4     3     2     1     0
 uint8_t weight   128    64    32    16     8     4     2     1
 int8_t  weight  -128    64    32    16     8     4     2     1     <- only bit 7 differs

 bits              1     1     1     1     1     0     1     1
 as uint8_t      128 + 64 + 32 + 16 + 8 + 0 + 2 + 1 =  251
 as int8_t      -128 + 64 + 32 + 16 + 8 + 0 + 2 + 1 =   -5

 negation is "flip every bit, then add one":
     5  = 0000 0101
    ~5  = 1111 1010     (this is -6: for any x, ~x == -x - 1)
   + 1  = 1111 1011     (this is -5)

 asymmetry: 1000 0000 = -128 has no positive twin.  -(-128) needs a ninth bit.
 range of int8_t: -128 .. 127      range of int32_t: -2147483648 .. 2147483647
```

The example's section 2 prints these patterns from live objects, and its `static_cast<std::uint8_t>(minus_five)` line demonstrates the key fact: converting signed to unsigned is a **no-op on the bits** (the standard defines it as "the value modulo 2^N", which two's complement makes free).

Now the evidence that signedness is a *compile-time* notion. Compile four tiny functions with `g++ -std=c++20 -O2 -c` and disassemble:

```text
$ objdump -d -C --no-show-raw-insn asm_probe_O2.o
0000000000000000 <add_signed(int, int)>:
   0:	endbr64
   4:	lea    (%rdi,%rsi,1),%eax
   7:	ret
...
0000000000000010 <add_unsigned(unsigned int, unsigned int)>:
  10:	endbr64
  14:	lea    (%rdi,%rsi,1),%eax
  17:	ret
...
0000000000000020 <less_signed(int, int)>:
  20:	endbr64
  24:	cmp    %esi,%edi
  26:	setl   %al
  29:	ret
...
0000000000000030 <less_unsigned(unsigned int, unsigned int)>:
  30:	endbr64
  34:	cmp    %esi,%edi
  36:	setb   %al
  39:	ret
```

`add_signed` and `add_unsigned` are **byte-for-byte the same instruction** (`lea` used as a three-operand add). The x86 adder has no idea whether its inputs are signed; two's complement was chosen precisely so that one adder serves both. The type only reappears where the *interpretation* matters: the comparison uses `setl` ("set if less", reads the sign and overflow flags) for `int` and `setb` ("set if below", reads the carry flag) for `unsigned`. The same duality exists for division (`idiv` vs `div`), right shift (`sar` vs `shr`, i.e. copy the sign bit vs shift in zeros), and widening (`movslq` sign-extends an `int` into a `long`; zero-extension is used for `unsigned`). Those instruction choices are all the "type" that survives compilation.

### 2.4 Unsigned wraps by definition; signed overflow is undefined

For unsigned types the standard says arithmetic is performed modulo 2^N — the carry out of the top bit is simply discarded, the borrow into it is simply invented. This is not "overflow" in the language's sense; it is the defined result. It is why the example's FNV-1a hash can write `hash *= 16777619u` and rely on the high bits vanishing identically on every platform — the same way Java's `String.hashCode()` relies on `int` wrap, except that in C++ you must reach for an unsigned type to get the guarantee.

```
Diagram 4 — uint8_t arithmetic lives on a ring of 256 values (modulo 2^8)

                255 ──▶ 0 ──▶ 1 ──▶ 2            255 + 1 = 0      carry out of bit 7 is discarded
             ▲                        ▼            0 - 1  = 255    borrow into "bit 8" is invented
           254                          3
            ▲        ring of 2^8        ▼         The CPU raises the carry flag (CF) in both cases.
           ...                         ...        Unsigned C++ never looks at CF: modular by contract.
            ▲                          ▼
           130 ◀── 129 ◀── 128 ◀── 127            int8_t: 127 + 1 produces 1000 0000 = "-128"
                                                  — same bits, but the language calls THIS undefined.
```

For signed types, **Integer Overflow (整数溢出)** is undefined behavior. Python developers rarely think about overflow at all (`int` is arbitrary precision); Java developers *know* the answer (`Integer.MAX_VALUE + 1 == Integer.MIN_VALUE`, guaranteed by JLS §15.18.2). C++ says something stronger and stranger: a program in which `INT_MAX + 1` is evaluated has no meaning at all, and the compiler may generate code under the assumption that it never happens.

Why would a language do that? Because the assumption "signed arithmetic never wraps" lets the optimizer treat integers like the mathematical integers you learned in school: `x + 1 > x` is always true, `2 * x / 2` is `x`, `for (int i = 0; i < n; ++i)` runs exactly `n` times so the loop can be vectorized. Here is the assumption at work. The function is `bool next_would_overflow(int x) { return x + 1 < x; }` — a perfectly reasonable Java idiom — compiled with g++ 13:

```text
$ g++ -std=c++20 -O2 -c p1_bug.cpp -o p1.o && objdump -d -C --no-show-raw-insn p1.o
...
0000000000000040 <next_would_overflow(int)>:
  40:	endbr64
  44:	xor    %eax,%eax
  46:	ret
...
$ g++ -std=c++20 -O0 -c asm_probe.cpp -o asm_probe_O0.o && objdump -d -C --no-show-raw-insn asm_probe_O0.o
...
00000000000000e7 <next_would_overflow(int)>:
  e7:	endbr64
  eb:	push   %rbp
  ec:	mov    %rsp,%rbp
  ef:	mov    %edi,-0x4(%rbp)
  f2:	mov    $0x0,%eax
  f7:	pop    %rbp
  f8:	ret
```

At `-O2` the whole function is `xor %eax,%eax` — return `false`, unconditionally; the addition was never emitted. Notice that **even at `-O0`** the body is `mov $0x0,%eax`: GCC's front end folds `x + 1 < x` to `false` before optimization passes run, because in a program without undefined behavior that is the only possible value. The same run compiled with `-fwrapv` (GCC's "make signed wrap" switch) returns `true`; with `-fsanitize=undefined` it prints `runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'` and then returns `true`. Three flags, three answers — which is exactly what "undefined" means.

The discipline that follows is the one the example's `checked_add` shows: **test the precondition, never the result.** `if (b > 0 && a > max - b)` only ever computes `max - b`, which cannot overflow when `b > 0`. Pitfall 1 shows the anti-pattern in full.

Two related conversions are *defined*, and the example relies on both: signed → unsigned is always modular (so `static_cast<unsigned>(-1)` is `4294967295`), and since C++20 unsigned → signed is modular too (`static_cast<std::int8_t>(200)` is `-56`; before C++20 this was implementation-defined, and g++ did the same thing anyway).

### 2.5 Integer promotion and the usual arithmetic conversions

Here is a fact that surprises everyone: **C++ never does arithmetic on anything narrower than `int`.** `bool`, `char`, `signed char`, `unsigned char` (= `std::uint8_t`), `short`, `unsigned short` (= `std::uint16_t`) are all widened to `int` before `+`, `-`, `*`, `/`, `~`, `<<`, comparison — every arithmetic or bitwise operator. This is **Integer Promotion (整型提升)**, and it is a compile-time rewrite of your expression's *type*. The run-time cost is visible in the unoptimized code:

```text
$ g++ -std=c++20 -O0 -c asm_probe.cpp && objdump -d -C --no-show-raw-insn asm_probe_O0.o
...
000000000000007b <add8(unsigned char, unsigned char)>:
  ...
  8d:	movzbl -0x4(%rbp),%edx
  91:	movzbl -0x8(%rbp),%eax
  95:	add    %edx,%eax
  97:	pop    %rbp
  98:	ret
```

`movzbl` — "move, zero-extending, byte to long(32-bit)" — is the promotion made visible: each one-byte operand is widened into a 32-bit register, and the `add` is a 32-bit add. (At `-O2` the same function is a single `lea (%rsi,%rdi,1),%eax`; the widening still happened, in the caller's registers.)

```
Diagram 5 — std::uint8_t stored = a + b;   (a = 200, b = 100) as g++ -O0 compiles it

  a  (1 byte: C8)  ──movzbl──▶  %edx = 0x000000C8   (int 200)   integer promotion:
  b  (1 byte: 64)  ──movzbl──▶  %eax = 0x00000064   (int 100)   widen to int BEFORE the add
                                        │
                                   add %edx,%eax
                                        ▼
                               %eax = 0x0000012C  (int 300)      <- the expression `a + b` IS this int:
                                        │                            decltype(a + b) == int, sizeof == 4
                          store the low byte only  (mov %al, stored)
                                        ▼
                             stored = 0x2C = 44   (300 mod 256)  <- implicit narrowing on assignment;
                                                                    -Wconversion would flag it
```

So `a + b` with two `uint8_t` values is `300`, an `int`, and does not wrap — the example prints exactly this, plus the truncation to `44` when the result is stored back into a `uint8_t`. The mirror image is `~a`: the complement of an `int` holding 200 is `-201`, not `55`; you only get `55` by narrowing back to eight bits.

After promotion come the **usual arithmetic conversions**, which pick one common type for a binary operator. The rule that hurts: **if one operand is signed and the other is unsigned of the same (or greater) rank, the signed one is converted to unsigned.** That is an **Implicit Conversion (隐式转换)** you never asked for. Evidence, from the same probe:

```text
0000000000000040 <mixed(int, unsigned int)>:
  40:	endbr64
  44:	cmp    %esi,%edi
  46:	setb   %al
  49:	ret
```

`mixed(int a, unsigned b)` returns `a < b`, and the compiler emitted `setb` — the *unsigned* comparison — because `a` was converted to `unsigned` first. With `a == -1` the bits `0xFFFFFFFF` are read as `4294967295`, so `-1 < 1u` is `false`. g++ warns about it under `-Wall`:

```text
cmp.cpp:2:71: warning: comparison of integer expressions of different signedness: 'int' and 'unsigned int' [-Wsign-compare]
```

C++20 added `std::cmp_less`, `std::cmp_equal`, … in `<utility>`, which compare *mathematical* values regardless of signedness; the example shows `std::cmp_less(-1, 1u)` returning `true`. The most common victim of this rule is the container size, which is `std::size_t` (unsigned 64-bit): `v.size() - 1` on an empty vector is `18446744073709551615`, and `i < v.size()` with a signed `i` converts `i` to unsigned. Pitfall 2 shows what happens next.

A brief ranking for the common type, from strongest to weakest: `long double` > `double` > `float` > (integers, after promotion) `unsigned long` > `long` > `unsigned int` > `int`. On LP64 `long` can represent every `unsigned int`, so `int` versus `unsigned int` goes unsigned but `unsigned int` versus `long` goes to `long`.

### 2.6 Value categories: what an expression *is*, not what it names

Every C++ expression has two compile-time properties: a type, and a **Value Category (值类别)**. Python has no such thing — every expression evaluates to a reference to some object, and `x` and `x + 1` are the same kind of thing. Java is closer (you cannot assign to `x + 1`), but it never lets you *ask*. C++ needs the distinction because it has **Reference (引用)** types (Chapter 3) that must bind to something with an address, and **Move Semantics (移动语义)** (Chapter 9) that need to know when a value is about to die and may be plundered.

```
Diagram 6 — the value-category taxonomy; every expression is exactly one leaf

                            expression
                          /            \
             glvalue (泛左值)            rvalue (右值)
             "has identity":            "may be moved from":
             it names a location        nobody else will observe it
             /             \            /              \
       lvalue               xvalue ("expiring")          prvalue
       (左值)               (将亡值)                    (纯右值)
   n,  v[0],  "literal",    std::move(n),               42,  n + 1,  make_name(),
   front(v) (returns int&)  f() declared to return T&&  std::string("t")

   decltype((e)) reports:   T&                 T&&                    T   (no reference)
   can bind to:             T&,  const T&      T&&,  const T&         T&&,  const T&
   has an address?          yes                yes                    no — materialized on demand
```

- An **lvalue (左值)** designates an object with identity: a named variable, an array element, a dereferenced pointer, a function call returning a reference, and — surprisingly — a string literal (`"literal"` is a `const char[8]` living in the read-only data section; it has an address, so it is an lvalue).
- A **prvalue (纯右值)** is a pure computation result: `42`, `n + 1`, a function call returning by value. It has no address. Since C++17 a prvalue is not even an object until the context demands one, at which point a **Temporary Object (临时对象)** is materialized (this is what makes **Copy Elision (拷贝省略)** guaranteed; Chapter 4).
- An **xvalue (将亡值)** is an lvalue that has been *marked expiring*: it still has identity, but the code promises nobody will look at it afterward. `std::move(n)` produces one. It is important to see that `std::move` does no moving; it is a cast to `int&&`:

```text
$ g++ -std=c++20 -O2 -c misc.cpp && objdump -d -C --no-show-raw-insn misc.o
0000000000000000 <to_xvalue(int&)>:
   0:	endbr64
   4:	mov    %rdi,%rax
   7:	ret
```

`int&& to_xvalue(int& x) { return std::move(x); }` copies the address from `%rdi` to `%rax` and returns. Nothing about the object changed; only its *category* did, and that exists solely in the compiler.

The two umbrella terms are **glvalue (泛左值)** (lvalue or xvalue: has identity) and **rvalue (右值)** (prvalue or xvalue: movable-from). The example's `VALUE_CATEGORY` macro reports the category with the `decltype((e))` trick — note the double parentheses: `decltype(n)` is the *declared type* of `n` (`int`), while `decltype((n))` is the type-and-category of the *expression* `n` (`int&`). It must be a macro because passing `e` to a function would give the function a named parameter, and a named parameter is always an lvalue — even one declared `int&&` (Chapter 9 returns to that).

Why this matters now: overload resolution *uses* value categories. The example's `demo::bind` has three overloads — `int&`, `const int&`, `int&&` — and the compiler picks `int&` for `n`, `const int&` for a `const` lvalue, and `int&&` for both `42` and `std::move(n)`. That is the entire mechanism behind "move constructors are preferred for temporaries" in Chapter 4 and 9: an rvalue binds to `T&&` in preference to `const T&`, and the choice is made once, at compile time.

### 2.7 Casts: four named tools versus one blunt instrument

Python has no casts, only constructor calls (`int("7")`). Java has one cast syntax that either converts primitives or checks a reference against the class hierarchy at run time, throwing `ClassCastException`. C++ splits "cast" into four keywords because they do four unrelated things, and the split lets the compiler check that you asked for the thing you meant. A **Type Cast (类型转换)** in C++ is always a compile-time request; whether it emits any instruction depends on which kind it is.

```
Diagram 7 — what each cast asks for (instructions verified with objdump -d on g++ -O2 output)

  cast expression                        compile-time check              run-time instructions
  ────────────────────────────────────── ─────────────────────────────── ───────────────────────────────
  static_cast<int>(3.7)                  a value conversion must exist   cvttsd2si %xmm0,%eax   real work
  static_cast<long>(int_value)           a value conversion must exist   movslq %edi,%rax       sign-extend
  static_cast<std::uint8_t>(300)         a value conversion must exist   keep the low byte      (= 44)
  reinterpret_cast<const unsigned char*> pointer/integer relabel only    mov %rdi,%rax          nothing
  const_cast<int*>(const int*)           only cv-qualifiers may differ   mov %rdi,%rax          nothing
  (int*)p        C-style / functional    tries, in order: const_cast, static_cast, static_cast+const_cast,
                                         reinterpret_cast, reinterpret_cast+const_cast — the first that
                                         compiles wins, SILENTLY.  -Wold-style-cast / -Wcast-qual reveal it.
  dynamic_cast<Derived*>(base_ptr)       type must be polymorphic        walks RTTI            Chapter 5
```

**`static_cast`** is the everyday conversion: numeric to numeric, `Derived*` to `Base*` and back (Chapter 5), `void*` to `T*`. It generates whatever instruction the conversion needs; `static_cast<int>(-3.7)` becomes `cvttsd2si` ("convert with truncation, scalar double to signed integer"), which is why the result is `-3`, not `-4`: C++ truncates toward zero, as Java does. The example's `static_cast<int>(1.15 * 100) == 114` is not a cast bug but a floating-point one: the `double` nearest to 1.15 is `1.1499999999999999112`, times 100 is `114.99999999999998579`, and truncation does the rest. Narrowing in the other direction is also a value conversion: `static_cast<std::uint8_t>(300)` keeps the low byte (`44`).

**`reinterpret_cast`** emits no instructions at all — it tells the compiler to treat the same address as pointing to a different type. The one use the standard blesses unconditionally is viewing an object as bytes through `unsigned char*` (or `std::byte*`), which the example uses to print `1.0f` as `0x00 0x00 0x80 0x3f`. Almost every other use is a **Strict Aliasing (严格别名)** violation: reading a `float` object through a `std::uint32_t&` is undefined behavior, and g++ at `-O2` (`-fstrict-aliasing`) *will* reorder loads and stores on the assumption that a `float*` and a `uint32_t*` never point to the same memory. The C++20 way to reinterpret a *value* is `std::bit_cast`, which copies the object representation and is a constant expression:

```
Diagram 8 — the four bytes of `const float one = 1.0f`, read through three types (x86-64, little-endian)

  address        &one+0    &one+1    &one+2    &one+3
  byte in RAM     0x00      0x00      0x80      0x3f          <- reinterpret_cast<const unsigned char*>(&one)

  as uint32_t     0x3f800000  =  0011 1111 1000 0000 0000 0000 0000 0000   <- std::bit_cast<std::uint32_t>(one)
                                 ^ ^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^
  as float        IEEE-754:      s exponent  fraction (23 bits)
                                 0 01111111  000…0   =  +1 × 2^(127-127) × 1.0  =  1.0f
  as int          1065353216     (same bits, signed weight on bit 31 — irrelevant here, bit 31 is 0)

  The least significant byte sits at the lowest address: that is "little-endian", a property of
  the CPU, not of C++ — the same code on a big-endian machine prints 0x3f 0x80 0x00 0x00.
```

**`const_cast`** also emits nothing. It removes (or adds) `const`/`volatile` from a pointer or reference. It is legal *only* when the object it eventually reaches is not itself `const` — the example calls a const-incorrect C-style `legacy_length(char*)` on a `std::string` whose buffer is writable, which is fine. Writing through a `const_cast` to an object that was *declared* `const` is undefined behavior, and on Linux the object very likely lives in a read-only **Page (页)** of the process's **Address Space (地址空间)**; Pitfall 3 shows both the crash and the stranger `-O2` result.

**C-style casts** — `(int*)p`, `int(x)` — are dangerous for exactly one reason: they mean "whichever of the above compiles". `(int*)&some_const_int` silently becomes a `const_cast`; `(Widget*)&gadget` silently becomes a `reinterpret_cast`. There is no way to grep for "the dangerous ones". The named casts exist so that `static_cast<int*>(&config::max_retries)` is a *compile error* (`invalid 'static_cast' from type 'const int*' to type 'int*'`, captured in Pitfall 3) while the C-style spelling compiles without a whisper under `-Wall -Wextra`.

Two more conversions belong here. Implicit numeric conversions are silent in assignment but *checked* in brace-initialization — a **Narrowing Conversion (窄化转换)** that loses information is rejected:

```text
$ g++ -std=c++20 -Wall -Wextra -c narrow.cpp
narrow.cpp:1:32: error: narrowing conversion of '3.7000000000000002e+0' from 'double' to 'int' [-Wnarrowing]
    1 | int main(){ int a = 3.7; int b{3.7}; return a+b; }
      |                                ^~~
```

`int a = 3.7;` compiled silently (a = 3); `int b{3.7};` did not. Prefer braces for initialization from now on. And `dynamic_cast`, the only cast that does work at run time (it consults **RTTI (Run-Time Type Information) (运行时类型信息)** to check a class hierarchy), is deferred to Chapter 5 because it needs virtual functions to exist first.

### 2.8 Function signatures, overloading, name mangling, and overload resolution

**Function Overloading (函数重载)** — several functions with the same name, distinguished by parameter lists — is ordinary in Java and impossible in Python (a second `def` simply rebinds the name). C++ resolves it entirely at compile time and needs two mechanisms to make it work: a way to *choose* among candidates, and a way to give each chosen function a distinct name for the **Linker (链接器)**, which (as Chapter 1 showed) matches nothing but byte strings.

**The signature.** A **Function Signature (函数签名)** is the name plus the parameter types (plus, for member functions, the class and any `const`/`&` qualifiers). The return type is *not* part of it, so two functions differing only in return type are not an overload set but a contradiction:

```text
$ g++ -std=c++20 -c rt.cpp
rt.cpp:2:8: error: ambiguating new declaration of 'double area(int)'
    2 | double area(int side);
      |        ^~~~
rt.cpp:1:8: note: old declaration 'int area(int)'
```

**Name mangling.** Because the linker sees only strings, the compiler must encode the signature *into the symbol name*. That encoding is **Name Mangling (名称修饰)**, and on Linux it follows the Itanium C++ ABI. Here is the **Object File (目标文件)** of the example's `overloads.cpp`, whose **Translation Unit (翻译单元)** defines nine functions with only two names:

```text
$ g++ -std=c++20 -c overloads.cpp && nm overloads.o
0000000000000298 T _ZN4demo4bindEOi
0000000000000245 T _ZN4demo4bindERKi
00000000000001f2 T _ZN4demo4bindERi
000000000000019f T _ZN4demo9type_nameEPKc
0000000000000000 T _ZN4demo9type_nameEc
000000000000014b T _ZN4demo9type_nameEd
0000000000000054 T _ZN4demo9type_nameEi
00000000000000a6 T _ZN4demo9type_nameEj
00000000000000f8 T _ZN4demo9type_nameEl
...
$ nm -C overloads.o          # -C = demangle, same as piping through c++filt
0000000000000298 T demo::bind(int&&)
0000000000000245 T demo::bind(int const&)
00000000000001f2 T demo::bind(int&)
000000000000019f T demo::type_name(char const*)
0000000000000000 T demo::type_name(char)
000000000000014b T demo::type_name(double)
0000000000000054 T demo::type_name(int)
00000000000000a6 T demo::type_name(unsigned int)
00000000000000f8 T demo::type_name(long)
...
```

Nine distinct **Symbol (符号)** names, each a `T` (defined in the text section) at its own offset. The encoding is mechanical:

```
Diagram 9 — Itanium C++ ABI mangling: the overloads.o symbols printed by nm above, plus a few from a probe file

  _ZN4demo9type_nameEPKc
  │ │ │    │         │ │└─ c        char                          } parameter list, left to right:
  │ │ │    │         │ └── K        const                         }   P K c  =  pointer to const char
  │ │ │    │         └──── P        pointer to                    }
  │ │ │    └────────────── E        end of the nested name
  │ │ └─────────────────── 4demo 9type_name   length-prefixed components:  demo::type_name
  │ └───────────────────── N        a nested (namespace- or class-qualified) name follows
  └─────────────────────── _Z       "this is a mangled C++ symbol"

  _ZN4demo9type_nameEc     c = char          _ZN4demo9type_nameEj   j = unsigned int
  _ZN4demo9type_nameEi     i = int           _ZN4demo9type_nameEl   l = long
  _ZN4demo9type_nameEd     d = double        _Z4add8hh              h = unsigned char (std::uint8_t), twice
  _ZN4demo4bindERi         R = lvalue reference to int             demo::bind(int&)
  _ZN4demo4bindERKi        R K = lvalue reference to const int     demo::bind(const int&)
  _ZN4demo4bindEOi         O = rvalue reference to int             demo::bind(int&&)
  _Z7cpp_addii             no N…E: global scope; two i's           cpp_add(int, int)
  c_add                    declared extern "C": no mangling at all, therefore cannot be overloaded

  Return types are not encoded for ordinary (non-template) functions — the linker-level reason
  behind the "ambiguating new declaration" error above.
```

The `extern "C"` line is how C++ calls into C libraries (it is why C library functions such as `strlen` show up unmangled in `nm` output): the compiler is told to emit the bare name, which also means there can be only one function of that name in the whole program.

**Overload resolution.** With the candidates known, the compiler must pick one — at compile time, from the *static* types and value categories of the arguments, never from run-time values. The procedure: collect the candidates by name; keep those that are *viable* (the argument count fits and every argument can be converted to the parameter type); then compare the implicit conversion sequences one argument at a time, using this ladder:

```
Diagram 10 — ranking one argument's implicit conversion sequence (best to worst).  A candidate wins
             when it is at least as good for every argument and strictly better for at least one;
             otherwise the call is ambiguous — a compile error, never a run-time guess.

  rank 1  EXACT MATCH     identity;  lvalue-to-rvalue;  array-to-pointer ("text" -> const char*);
                          function-to-pointer;  adding const/volatile (int* -> const int*)
  rank 2  PROMOTION       bool / char / short / std::uint8_t / std::uint16_t -> int;   float -> double
  rank 3  CONVERSION      int -> long,  int -> double,  int -> unsigned,  double -> int,
                          Derived* -> Base*,  ANY pointer -> bool,  ANY arithmetic -> bool
  rank 4  USER-DEFINED    const char* -> std::string (via a constructor);  any operator T()
  rank 5  ELLIPSIS        f(...)

  type_name(true)       bool->int is rank 2;  bool->char/unsigned/long/double are rank 3     => int
  type_name(s) (short)  short->int is rank 2                                                  => int
  type_name(1.5f)       float->double is rank 2                                               => double
  log_value(42)         int->long and int->double are BOTH rank 3                             => ambiguous
  configure("prod")     const char[5] -> bool is a standard sequence (rank 3);
                        -> std::string is user-defined (rank 4)                               => bool (!)
  bind(n)               int& and const int& both bind an lvalue; the less-qualified one wins   => int&
  bind(42)              int&& binds an rvalue; const int& also could — rvalue ref wins         => int&&
```

The ambiguity case is real and instantly reproducible — Java would choose `long` here because its rules prefer the "most specific" primitive widening, but C++ ranks `int → long` and `int → double` identically:

```text
$ g++ -std=c++20 -Wall -Wextra ambig.cpp
ambig.cpp:4:23: error: call of overloaded 'log_value(int)' is ambiguous
    4 | int main() { log_value(42); }
      |              ~~~~~~~~~^~~~
ambig.cpp:2:6: note: candidate: 'void log_value(long int)'
ambig.cpp:3:6: note: candidate: 'void log_value(double)'
```

The `configure("prod")` row is the nastier one, because it *does* compile — Pitfall 4. The lesson for a Java developer: C++ overload resolution is not "pick the most specific type" but "pick the cheapest conversion", and a standard conversion (even a lossy one, even to `bool`) is always cheaper than calling a constructor.

### 2.9 One statement, compile time versus run time

Take one line from the example, `std::cout << "  type_name(short{1})  -> " << demo::type_name(s)` with `const short s = 1;`, and separate what happens when:

```
Diagram 11 — the journey of  demo::type_name(s)   (s is a const short)

  COMPILE TIME (g++ reading main.cpp)                      what is left afterwards
  ─────────────────────────────────────────────────────    ─────────────────────────────────────────
  1. name lookup: `demo::type_name` names 6 functions      nothing — an in-memory list
  2. argument `s`: type `const short`, category lvalue     nothing
  3. viable set: all 6 (short converts to each)            nothing
  4. rank: short->int is a PROMOTION (rank 2);
     short->char/unsigned/long/double are CONVERSIONS      nothing
  5. winner: type_name(int); insert the promotion          instructions:  movswl  s, %edi   (sign-extend 16->32)
  6. emit a reference to the mangled symbol                relocation:    call  _ZN4demo9type_nameEi
  ─────────────────────────────────────────────────────    ─────────────────────────────────────────
  LINK TIME (ld)                                           _ZN4demo9type_nameEi resolved to overloads.o offset 0x54
  ─────────────────────────────────────────────────────    ─────────────────────────────────────────
  RUN TIME (CPU)                                           movswl; call; the callee returns the string_view
                                                           {"int", 3};  no type, no name, no lookup exists
```

Every "decision" in this chapter — how wide, signed or not, promote or not, which overload, which cast, which value category — sits in the left column. The right column contains only widths of registers and the opcodes chosen. When the two disagree, the right column always wins, and that is the shape of every pitfall in section 4.

## 3. Complete, Production-Grade Code Example

The program below is a type probe: eight numbered sections print, from live objects, every fact section 2 claimed — sizes, two's-complement patterns, modular unsigned arithmetic, a checked signed addition, integer promotion and mixed-sign comparison, value categories reported by `decltype((e))` and by reference-overload selection, the three named casts with their bit-level effects, and overload resolution across the promotion/conversion ladder. Nothing in its output depends on addresses, time, or locale, so it prints the same bytes on every run.

**`examples/ch02/bits.h`**

```cpp
// bits.h — render the raw object representation of an integer.
//
// `template <typename Int>` means "this works for any integer type"; templates
// are explained in Chapter 7.  Here they only save us eight identical overloads.
#ifndef CH02_BITS_H
#define CH02_BITS_H

#include <cstddef>
#include <string>
#include <type_traits>

namespace bits {

// Two's-complement bit pattern, most significant bit first, grouped in nibbles.
// pattern(std::int8_t{-5}) == "1111 1011"
template <typename Int>
[[nodiscard]] std::string pattern(Int value) {
    static_assert(std::is_integral_v<Int> && !std::is_same_v<Int, bool>,
                  "pattern() shows integer representations only");
    using Unsigned = std::make_unsigned_t<Int>;     // same width, no sign bit
    const Unsigned raw = static_cast<Unsigned>(value); // signed->unsigned: modular, well defined
    constexpr int width = static_cast<int>(sizeof(Unsigned)) * 8;
    std::string out;
    for (int bit = width - 1; bit >= 0; --bit) {
        out += ((raw >> bit) & 1u) ? '1' : '0';
        if (bit % 4 == 0 && bit != 0) out += ' ';
    }
    return out;
}

// Same bytes as fixed-width hexadecimal: hex(std::uint8_t{0x3f}) == "0x3f"
template <typename Int>
[[nodiscard]] std::string hex(Int value) {
    using Unsigned = std::make_unsigned_t<Int>;
    Unsigned raw = static_cast<Unsigned>(value);
    std::string digits(sizeof(Unsigned) * 2, '0');
    for (std::size_t i = digits.size(); i-- > 0; raw >>= 4)
        digits[i] = "0123456789abcdef"[raw & 0xFu];
    return "0x" + digits;
}

}  // namespace bits

#endif  // CH02_BITS_H
```

**`examples/ch02/overloads.h`**

```cpp
// overloads.h — two overload sets used to watch overload resolution happen.
// Which function a call lands on is fixed at compile time from the static types
// (and value categories) of the arguments; nothing is looked up at run time.
#ifndef CH02_OVERLOADS_H
#define CH02_OVERLOADS_H

#include <string_view>

namespace demo {

// Overloaded on parameter TYPE.  Each returns the name of the overload chosen.
[[nodiscard]] std::string_view type_name(char) noexcept;
[[nodiscard]] std::string_view type_name(int) noexcept;
[[nodiscard]] std::string_view type_name(unsigned) noexcept;
[[nodiscard]] std::string_view type_name(long) noexcept;
[[nodiscard]] std::string_view type_name(double) noexcept;
[[nodiscard]] std::string_view type_name(const char*) noexcept;

// Overloaded on the VALUE CATEGORY of the argument (all three take an int).
[[nodiscard]] std::string_view bind(int&) noexcept;        // modifiable lvalue only
[[nodiscard]] std::string_view bind(const int&) noexcept;  // any lvalue; rvalues as fallback
[[nodiscard]] std::string_view bind(int&&) noexcept;       // rvalues: prvalue or xvalue

}  // namespace demo

#endif  // CH02_OVERLOADS_H
```

**`examples/ch02/overloads.cpp`**

```cpp
// overloads.cpp — one translation unit; `nm overloads.o` shows the mangled names.
#include "overloads.h"

namespace demo {

std::string_view type_name(char) noexcept        { return "char"; }
std::string_view type_name(int) noexcept         { return "int"; }
std::string_view type_name(unsigned) noexcept    { return "unsigned"; }
std::string_view type_name(long) noexcept        { return "long"; }
std::string_view type_name(double) noexcept      { return "double"; }
std::string_view type_name(const char*) noexcept { return "const char*"; }

std::string_view bind(int&) noexcept       { return "int&"; }
std::string_view bind(const int&) noexcept { return "const int&"; }
std::string_view bind(int&&) noexcept      { return "int&&"; }

}  // namespace demo
```

**`examples/ch02/main.cpp`**

```cpp
// main.cpp — Chapter 2: what the machine sees when C++ talks about "types".
// Every line printed is a deterministic fact about g++ 13 on x86-64 Linux (LP64).
#include <bit>
#include <cstddef>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <limits>
#include <optional>
#include <string>
#include <string_view>
#include <type_traits>
#include <utility>
#include <vector>

#include "bits.h"
#include "overloads.h"

namespace {

void heading(std::string_view text) { std::cout << "\n== " << text << " ==\n"; }

// ---- 1. sizes -------------------------------------------------------------
struct TypeRow { const char* name; std::size_t size; };

void show_sizes() {
    heading("1. sizeof: bytes per object");
    constexpr TypeRow rows[] = {
        {"bool", sizeof(bool)},     {"char", sizeof(char)},          {"short", sizeof(short)},
        {"int", sizeof(int)},       {"long", sizeof(long)},          {"long long", sizeof(long long)},
        {"float", sizeof(float)},   {"double", sizeof(double)},      {"long double", sizeof(long double)},
        {"void*", sizeof(void*)},   {"std::size_t", sizeof(std::size_t)},
        {"std::int8_t", sizeof(std::int8_t)}, {"std::int64_t", sizeof(std::int64_t)},
    };
    for (const TypeRow& r : rows)
        std::cout << "  " << std::left << std::setw(13) << r.name << std::right << r.size << '\n';
    static_assert(sizeof(std::int32_t) == 4, "fixed-width types are exact by definition");
    std::cout << "  int holds " << std::numeric_limits<int>::min() << " .. "
              << std::numeric_limits<int>::max() << " (31 value bits + 1 sign bit)\n";
}

// ---- 2. two's complement --------------------------------------------------
void show_twos_complement() {
    heading("2. Two's complement: the sign is just the top bit's weight");
    const std::int8_t five = 5;
    const std::int8_t minus_five = -5;
    std::cout << "  int8_t    5 = " << bits::pattern(five) << '\n';
    std::cout << "  int8_t   -5 = " << bits::pattern(minus_five) << "  (~5 + 1)\n";
    std::cout << "  int8_t   -1 = " << bits::pattern(std::int8_t{-1}) << '\n';
    std::cout << "  int8_t -128 = " << bits::pattern(std::int8_t{-128}) << '\n';
    // The same 8 bits read as unsigned: 128+64+32+16+8+2+1 = 251.
    const auto same_bits = static_cast<std::uint8_t>(minus_five);
    std::cout << "  uint8_t " << static_cast<int>(same_bits) << " = " << bits::pattern(same_bits)
              << "  <- identical bits, different weight for bit 7\n";
    std::cout << "  int32_t  -1 = " << bits::pattern(-1) << " = " << bits::hex(-1) << '\n';
}

// ---- 3. unsigned wraps, and code that relies on it ------------------------
// FNV-1a: the multiply is *supposed* to drop the high bits.  Unsigned makes
// that a defined modular operation, so this hash is portable and deterministic.
[[nodiscard]] std::uint32_t fnv1a(std::string_view text) noexcept {
    std::uint32_t hash = 2166136261u;
    for (unsigned char byte : text) {
        hash ^= byte;             // byte is promoted to int, then converted to uint32_t
        hash *= 16777619u;        // wraps modulo 2^32 by definition
    }
    return hash;
}

void show_unsigned_wrap() {
    heading("3. Unsigned arithmetic is modular (defined behavior)");
    std::uint8_t odometer = 255;
    odometer += 1;                // computed as int 256, stored modulo 256
    std::cout << "  uint8_t 255 + 1 = " << static_cast<int>(odometer) << '\n';
    std::uint8_t zero = 0;
    zero -= 1;
    std::cout << "  uint8_t   0 - 1 = " << static_cast<int>(zero) << '\n';
    const unsigned max = std::numeric_limits<unsigned>::max();
    std::cout << "  unsigned max + 1 = " << max + 1u << '\n';
    std::cout << "  0u - 1 = " << 0u - 1u << " = " << bits::hex(0u - 1u) << '\n';
    std::cout << "  fnv1a(\"hello\") = " << bits::hex(fnv1a("hello")) << '\n';
}

// ---- 4. signed overflow is UB: test the precondition, never the result -----
[[nodiscard]] std::optional<int> checked_add(int a, int b) noexcept {
    constexpr int max = std::numeric_limits<int>::max();
    constexpr int min = std::numeric_limits<int>::min();
    if (b > 0 && a > max - b) return std::nullopt;   // a + b would exceed INT_MAX
    if (b < 0 && a < min - b) return std::nullopt;   // a + b would go below INT_MIN
    return a + b;                                    // now provably in range
}

void report_add(int a, int b) {
    std::cout << "  checked_add(" << a << ", " << b << ") -> ";
    if (const auto sum = checked_add(a, b)) std::cout << *sum << '\n';
    else                                    std::cout << "overflow, no result\n";
}

void show_signed_overflow() {
    heading("4. Signed overflow is undefined: check before, not after");
    report_add(2147483640, 7);
    report_add(2147483647, 1);
    report_add(-2147483648, -1);
    // -INT_MIN does not fit in int; widen first, then negate.
    const long long widened = -static_cast<long long>(std::numeric_limits<int>::min());
    std::cout << "  -(INT_MIN) computed in long long = " << widened << '\n';
}

// ---- 5. integer promotion and mixed-sign comparison ------------------------
void show_promotion() {
    heading("5. Integer promotion: nothing is computed narrower than int");
    std::uint8_t a = 200, b = 100;
    static_assert(std::is_same_v<decltype(a + b), int>, "uint8_t + uint8_t is an int");
    std::cout << "  uint8_t a = 200, b = 100; a + b = " << a + b << " (sizeof " << sizeof(a + b) << ")\n";
    std::uint8_t stored = a + b;  // silently truncated on store (-Wconversion would flag it)
    std::cout << "  uint8_t stored = a + b   -> " << static_cast<int>(stored) << '\n';
    std::cout << "  std::cout << stored prints '" << stored << "' (uint8_t is unsigned char)\n";
    std::cout << "  ~a = " << ~a << " as int; as uint8_t = " << static_cast<int>(static_cast<std::uint8_t>(~a)) << '\n';

    const int negative = -1;
    const unsigned one = 1u;
    // `negative < one` converts -1 to unsigned first; -Wsign-compare warns, so we spell it out.
    std::cout << std::boolalpha;
    std::cout << "  -1 < 1u  (usual arithmetic conversions) = " << (static_cast<unsigned>(negative) < one)
              << "  because -1 becomes " << static_cast<unsigned>(negative) << '\n';
    std::cout << "  std::cmp_less(-1, 1u)                   = " << std::cmp_less(negative, one) << '\n';
    const std::vector<int> empty;
    std::cout << "  empty.size() - 1 = " << empty.size() - 1 << '\n';
}

// ---- 6. value categories ---------------------------------------------------
// decltype((e)) — note the double parentheses — reports the value category of e:
//   T& -> lvalue,  T&& -> xvalue,  plain T -> prvalue.
// It has to be a macro: passing e to a function would turn it into a named lvalue.
#define VALUE_CATEGORY(e)                                     \
    (std::is_lvalue_reference_v<decltype((e))>   ? "lvalue"   \
     : std::is_rvalue_reference_v<decltype((e))> ? "xvalue"   \
                                                 : "prvalue")

[[nodiscard]] std::string make_name() { return "temp"; }
[[nodiscard]] int& front(std::vector<int>& v) noexcept { return v[0]; }

void show_value_categories() {
    heading("6. Value categories: what an expression IS, not what it names");
    int n = 7;
    const int cn = 7;
    std::vector<int> v{1, 2, 3};
    std::cout << "  n            : " << VALUE_CATEGORY(n) << '\n';
    std::cout << "  n + 1        : " << VALUE_CATEGORY(n + 1) << '\n';
    std::cout << "  42           : " << VALUE_CATEGORY(42) << '\n';
    std::cout << "  \"literal\"    : " << VALUE_CATEGORY("literal") << "  (string literals live in .rodata)\n";
    std::cout << "  std::move(n) : " << VALUE_CATEGORY(std::move(n)) << '\n';
    std::cout << "  make_name()  : " << VALUE_CATEGORY(make_name()) << "  (returns std::string by value: \"" << make_name() << "\")\n";
    std::cout << "  front(v)     : " << VALUE_CATEGORY(front(v)) << "  (returns int&, aliases v[0] = " << front(v) << ")\n";
    std::cout << "  bind(n)            -> " << demo::bind(n) << '\n';
    std::cout << "  bind(cn)           -> " << demo::bind(cn) << '\n';
    std::cout << "  bind(42)           -> " << demo::bind(42) << '\n';
    std::cout << "  bind(std::move(n)) -> " << demo::bind(std::move(n)) << '\n';
}

// ---- 7. casts --------------------------------------------------------------
// A C-era API that never writes through the pointer but was declared with char*.
[[nodiscard]] std::size_t legacy_length(char* s) noexcept {
    std::size_t n = 0;
    while (s[n] != '\0') ++n;
    return n;
}

void show_casts() {
    heading("7. Casts: static_cast converts, reinterpret_cast relabels, const_cast unlocks");
    std::cout << "  static_cast<int>(-3.7)       = " << static_cast<int>(-3.7) << "  (cvttsd2si truncates toward zero)\n";
    std::cout << "  static_cast<int>(1.15 * 100) = " << static_cast<int>(1.15 * 100) << "  (1.15 is really 1.149999...)\n";
    std::cout << "  static_cast<uint8_t>(300)    = " << static_cast<int>(static_cast<std::uint8_t>(300)) << "  (300 mod 256)\n";
    std::cout << "  static_cast<int8_t>(200)     = " << static_cast<int>(static_cast<std::int8_t>(200)) << "  (bits 1100 1000 reread as signed)\n";

    const float one = 1.0f;
    // Viewing any object as bytes through unsigned char* is the one reinterpret_cast
    // the standard blesses.  No instruction is emitted; only the type label changes.
    const auto* bytes = reinterpret_cast<const unsigned char*>(&one);
    std::cout << "  float 1.0f in memory (x86-64 little-endian):";
    for (std::size_t i = 0; i < sizeof one; ++i) std::cout << ' ' << bits::hex(bytes[i]);
    std::cout << '\n';
    const auto as_u32 = std::bit_cast<std::uint32_t>(one);   // value-level reinterpretation
    std::cout << "  std::bit_cast<uint32_t>(1.0f) = " << bits::hex(as_u32) << " = " << bits::pattern(as_u32) << '\n';

    const std::string text = "hello";    // the string object is const here...
    // ...but legacy_length never writes, so removing const for the call is legal.
    std::cout << "  legacy_length(const_cast<char*>(text.c_str())) = "
              << legacy_length(const_cast<char*>(text.c_str())) << ", text still \"" << text << "\"\n";
}

// ---- 8. overload resolution ------------------------------------------------
void show_overloads() {
    heading("8. Overload resolution: picked at compile time from static types");
    const short s = 1;
    const std::uint8_t byte = 7;
    std::cout << "  type_name('a')       -> " << demo::type_name('a')   << "  (exact match)\n";
    std::cout << "  type_name(short{1})  -> " << demo::type_name(s)     << "  (integral promotion)\n";
    std::cout << "  type_name(uint8_t{7})-> " << demo::type_name(byte)  << "  (integral promotion)\n";
    std::cout << "  type_name(true)      -> " << demo::type_name(true)  << "  (bool promotes to int)\n";
    std::cout << "  type_name(1u)        -> " << demo::type_name(1u)    << "  (exact match)\n";
    std::cout << "  type_name(1L)        -> " << demo::type_name(1L)    << "  (exact match)\n";
    std::cout << "  type_name(1.5f)      -> " << demo::type_name(1.5f)  << "  (floating-point promotion)\n";
    std::cout << "  type_name(\"text\")    -> " << demo::type_name("text") << "  (array-to-pointer)\n";
}

}  // namespace

int main() {
    std::cout << "Chapter 2 probe: g++ 13, x86-64 Linux, LP64";
    show_sizes();
    show_twos_complement();
    show_unsigned_wrap();
    show_signed_overflow();
    show_promotion();
    show_value_categories();
    show_casts();
    show_overloads();
    return 0;
}
```

**Build and run:**
```text
$ g++ -std=c++20 -Wall -Wextra main.cpp overloads.cpp -o main
$ ./main
```
**Terminal Output:**
```text
Chapter 2 probe: g++ 13, x86-64 Linux, LP64
== 1. sizeof: bytes per object ==
  bool         1
  char         1
  short        2
  int          4
  long         8
  long long    8
  float        4
  double       8
  long double  16
  void*        8
  std::size_t  8
  std::int8_t  1
  std::int64_t 8
  int holds -2147483648 .. 2147483647 (31 value bits + 1 sign bit)

== 2. Two's complement: the sign is just the top bit's weight ==
  int8_t    5 = 0000 0101
  int8_t   -5 = 1111 1011  (~5 + 1)
  int8_t   -1 = 1111 1111
  int8_t -128 = 1000 0000
  uint8_t 251 = 1111 1011  <- identical bits, different weight for bit 7
  int32_t  -1 = 1111 1111 1111 1111 1111 1111 1111 1111 = 0xffffffff

== 3. Unsigned arithmetic is modular (defined behavior) ==
  uint8_t 255 + 1 = 0
  uint8_t   0 - 1 = 255
  unsigned max + 1 = 0
  0u - 1 = 4294967295 = 0xffffffff
  fnv1a("hello") = 0x4f9f2cab

== 4. Signed overflow is undefined: check before, not after ==
  checked_add(2147483640, 7) -> 2147483647
  checked_add(2147483647, 1) -> overflow, no result
  checked_add(-2147483648, -1) -> overflow, no result
  -(INT_MIN) computed in long long = 2147483648

== 5. Integer promotion: nothing is computed narrower than int ==
  uint8_t a = 200, b = 100; a + b = 300 (sizeof 4)
  uint8_t stored = a + b   -> 44
  std::cout << stored prints ',' (uint8_t is unsigned char)
  ~a = -201 as int; as uint8_t = 55
  -1 < 1u  (usual arithmetic conversions) = false  because -1 becomes 4294967295
  std::cmp_less(-1, 1u)                   = true
  empty.size() - 1 = 18446744073709551615

== 6. Value categories: what an expression IS, not what it names ==
  n            : lvalue
  n + 1        : prvalue
  42           : prvalue
  "literal"    : lvalue  (string literals live in .rodata)
  std::move(n) : xvalue
  make_name()  : prvalue  (returns std::string by value: "temp")
  front(v)     : lvalue  (returns int&, aliases v[0] = 1)
  bind(n)            -> int&
  bind(cn)           -> const int&
  bind(42)           -> int&&
  bind(std::move(n)) -> int&&

== 7. Casts: static_cast converts, reinterpret_cast relabels, const_cast unlocks ==
  static_cast<int>(-3.7)       = -3  (cvttsd2si truncates toward zero)
  static_cast<int>(1.15 * 100) = 114  (1.15 is really 1.149999...)
  static_cast<uint8_t>(300)    = 44  (300 mod 256)
  static_cast<int8_t>(200)     = -56  (bits 1100 1000 reread as signed)
  float 1.0f in memory (x86-64 little-endian): 0x00 0x00 0x80 0x3f
  std::bit_cast<uint32_t>(1.0f) = 0x3f800000 = 0011 1111 1000 0000 0000 0000 0000 0000
  legacy_length(const_cast<char*>(text.c_str())) = 5, text still "hello"

== 8. Overload resolution: picked at compile time from static types ==
  type_name('a')       -> char  (exact match)
  type_name(short{1})  -> int  (integral promotion)
  type_name(uint8_t{7})-> int  (integral promotion)
  type_name(true)      -> int  (bool promotes to int)
  type_name(1u)        -> unsigned  (exact match)
  type_name(1L)        -> long  (exact match)
  type_name(1.5f)      -> double  (floating-point promotion)
  type_name("text")    -> const char*  (array-to-pointer)
```

## 4. Pitfalls and Anti-Patterns

Every snippet below was compiled and run with g++ 13.3 exactly as shown; the full programs are in `examples/ch02/pitfalls/`.

### Pitfall 1: Testing for signed overflow after the fact
**Buggy Snippet:**
```cpp
// In Java, int arithmetic wraps, so (x + 1 < x) is a legitimate overflow test.
// In C++, x + 1 is undefined behavior when x == INT_MAX, and the compiler may
// assume undefined behavior never happens -- so x + 1 < x is "always false".
bool next_would_overflow(int x) {
    return x + 1 < x;
}

int next_id(int current) {
    return current + 1;          // undefined behavior when current == INT_MAX
}

int main() {
    int id = std::numeric_limits<int>::max();
    std::cout << std::boolalpha;
    std::cout << "id = " << id << '\n';
    std::cout << "next_would_overflow(id) = " << next_would_overflow(id) << '\n';
    std::cout << "next_id(id) = " << next_id(id) << '\n';
    return 0;
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra -O2 p1_bug.cpp -o p1 && ./p1        # no warning; -O0 prints the same
id = 2147483647
next_would_overflow(id) = false
next_id(id) = -2147483648

$ g++ -std=c++20 -O0 -fsanitize=undefined p1_bug.cpp -o p1_ubsan && ./p1_ubsan
p1_bug.cpp:9:14: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
p1_bug.cpp:13:22: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
...

$ g++ -std=c++20 -O2 -c p1_bug.cpp -o p1.o && objdump -d -C --no-show-raw-insn p1.o
...
0000000000000040 <next_would_overflow(int)>:
  40:	endbr64
  44:	xor    %eax,%eax
  46:	ret
0000000000000050 <next_id(int)>:
  50:	endbr64
  54:	lea    0x1(%rdi),%eax
  57:	ret
```
**Underlying Cause:** The guard says `false` while the very next line wraps to `-2147483648` — the program contradicts itself, which is only possible because `x + 1` with `x == INT_MAX` is undefined behavior. g++ folds `x + 1 < x` to the constant `false` (the `xor %eax,%eax` above; at `-O0` it is `mov $0x0,%eax`, same thing) because in any program *without* UB the comparison cannot be true, and the compiler is entitled to assume your program has none. `next_id` then compiles to a plain `lea 0x1(%rdi),%eax`, and the x86 adder wraps the bits exactly as Diagram 4 shows — so you see the Java answer, but only by accident of this instruction on this CPU. The two behaviors are not "the compiler being inconsistent"; they are two different but equally legal readings of code that has no defined meaning. `-fwrapv` would make g++ promise wrapping (the guard then prints `true`), but that is a compiler dialect, not C++, and it disables the optimizations that make signed loop counters fast. `-fsanitize=undefined` is the correct tool: it makes the UB *visible* at the exact source line, at run time, in test builds.

**Fix:**
```cpp
// No arithmetic can overflow here: we only compare against the limit.
[[nodiscard]] bool next_would_overflow(int x) noexcept {
    return x == std::numeric_limits<int>::max();
}

// Returns no value instead of producing a value that never existed.
[[nodiscard]] std::optional<int> next_id(int current) noexcept {
    if (next_would_overflow(current)) return std::nullopt;
    return current + 1;          // provably in range
}
```

### Pitfall 2: `v.size() - 1` and a signed loop counter
**Buggy Snippet:**
```cpp
// Print every adjacent pair (v[i], v[i+1]).
void print_pairs(const std::vector<int>& v) {
    for (int i = 0; i < v.size() - 1; ++i)      // size() is unsigned: 0 - 1 wraps
        std::cout << '(' << v[i] << ',' << v[i + 1] << ") ";
    std::cout << '\n';
}

int main() {
    print_pairs({1, 2, 3});
    print_pairs({});                            // empty: the loop bound is 18446744073709551615
    return 0;
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2
p2_bug.cpp: In function 'void print_pairs(const std::vector<int>&)':
p2_bug.cpp:7:23: warning: comparison of integer expressions of different signedness: 'int' and 'std::vector<int>::size_type' {aka 'long unsigned int'} [-Wsign-compare]
    7 |     for (int i = 0; i < v.size() - 1; ++i)      // size() is unsigned: 0 - 1 wraps
      |                     ~~^~~~~~~~~~~~~~
$ ./p2
(1,2) (2,3)
Segmentation fault

$ g++ -std=c++20 -g -O0 -fsanitize=address p2_bug.cpp -o p2_asan && ./p2_asan
(1,2) (2,3)
AddressSanitizer:DEADLYSIGNAL
=================================================================
==2055==ERROR: AddressSanitizer: SEGV on unknown address 0x000000000000 (pc 0x557e9cd164cc ...)
==2055==The signal is caused by a READ memory access.
==2055==Hint: address points to the zero page.
    #0 0x557e9cd164cc in print_pairs(std::vector<int, std::allocator<int> > const&) p2_bug.cpp:8
    #1 0x557e9cd1686a in main p2_bug.cpp:14
...
```
**Underlying Cause:** `v.size()` returns `std::size_t`, an unsigned 64-bit integer, and `- 1` is unsigned arithmetic: for the empty vector it yields `0 - 1 = 18446744073709551615` on the ring of Diagram 4 — there is no `-1` to compare against. The loop condition `i < v.size() - 1` then applies the usual arithmetic conversions of section 2.5: `int i` is converted to unsigned (the warning is g++ telling you exactly that), and `0u < 18446744073709551615u` is true, so the body runs. `v[i]` on an empty `std::vector` **Dereference (解引用)**s its data pointer, which is the **Null Pointer (空指针)** — the vector never allocated — so the CPU issues a load from address 0. The zero page is never mapped in a Linux process, the load raises a page fault, and the kernel delivers `SIGSEGV`: the **Segmentation Fault (段错误)** you see. Had the vector been non-empty but shorter than expected, the same loop would have read *past* the buffer without any signal, and only ASan would have noticed. In Python `len(v) - 1` is simply `-1` and `range(-1)` is empty; in Java `size()` returns a signed `int`. In C++ the sizes are unsigned on purpose (they index the full address space), and you must never subtract from one.

**Fix:**
```cpp
void print_pairs(const std::vector<int>& v) {
    for (std::size_t i = 0; i + 1 < v.size(); ++i)   // i + 1 cannot wrap: i < size()
        std::cout << '(' << v[i] << ',' << v[i + 1] << ") ";
    std::cout << '\n';
}
```
`i + 1 < v.size()` is the same mathematical condition with the addition moved to the side that cannot wrap (`i < size()` is an invariant of the loop, so `i + 1` fits). The loop counter is `std::size_t`, the same type as `size()`, so no conversion happens and `-Wsign-compare` stays silent. When you genuinely need signed/unsigned comparison, use `std::cmp_less(i, v.size())` from `<utility>`.

### Pitfall 3: A C-style cast that quietly throws away `const`
**Buggy Snippet:**
```cpp
namespace config {
const int max_retries = 3;      // a const object: the compiler puts it in .rodata
}

void set_retries(int* slot, int value) {
    *slot = value;
}

int main() {
    std::cout << "before: " << config::max_retries << '\n';
    set_retries((int*)&config::max_retries, 10);   // (int*) silently means const_cast<int*>
    std::cout << "after:  " << config::max_retries << '\n';
    return 0;
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p3_bug.cpp -o p3          # compiles without a single warning
$ ./p3
before: 3
Segmentation fault

$ g++ -std=c++20 -O2 p3_bug.cpp -o p3_O2 && ./p3_O2 ; echo "exit=$?"
before: 3
after:  3
exit=0

$ gdb -batch -ex run -ex 'x/i $pc' ./p3            # built with -g -O0
Program received signal SIGSEGV, Segmentation fault.
0x000055555555519f in set_retries (slot=0x555555556004 <config::max_retries>, value=10) at p3_bug.cpp:9
9	    *slot = value;
=> 0x55555555519f <_Z11set_retriesPii+22>:	mov    %edx,(%rax)

$ nm -C p3.o | grep retries ; readelf -lW p3 | grep -E 'LOAD|\.rodata'
0000000000000000 r config::max_retries
  LOAD           0x002000 0x0000000000002000 0x0000000000002000 0x00012c 0x00012c R   0x1000
   04     .rodata .eh_frame_hdr .eh_frame

$ sed 's/(int\*)&config::max_retries/static_cast<int*>(\&config::max_retries)/' p3_bug.cpp > p3_static.cpp && g++ -std=c++20 -c p3_static.cpp
p3_static.cpp:14:17: error: invalid 'static_cast' from type 'const int*' to type 'int*'

$ g++ -std=c++20 -Wall -Wextra -Wold-style-cast -Wcast-qual -c p3_bug.cpp
p3_bug.cpp:14:32: warning: use of old-style cast to 'int*' [-Wold-style-cast]
p3_bug.cpp:14:17: warning: cast from type 'const int*' to type 'int*' casts away qualifiers [-Wcast-qual]
```
**Underlying Cause:** `(int*)` is a C-style cast, and by the rule in Diagram 7 it silently became `const_cast<int*>`. The object it points to *is* `const`: `nm` shows `config::max_retries` as a lowercase `r` — a read-only data symbol — and `readelf -l` shows the `.rodata` section mapped in a `LOAD` segment whose flags are `R` only. At `-O0` the store `mov %edx,(%rax)` is emitted as written; the CPU's page-table entry for that page has no write permission, the MMU raises a protection fault, and the kernel sends `SIGSEGV`. At `-O2` something worse happens: because the compiler *knows* a `const int` can never change, it constant-folds both `std::cout << config::max_retries` to `3` and, having inlined `set_retries`, deletes the store as dead — the `-O2` binary contains no write at all (its `main` is two `mov $0x3,%esi` sequences). The program neither crashes nor updates; it lies. That is why modifying a `const` object through a cast is undefined behavior and not merely "a write to read-only memory": the compiler's contract about `const` is stronger than the OS's. `static_cast` refuses the conversion outright because it will not touch qualifiers; only `const_cast` — or the C-style spelling that hides one — will.

**Fix:**
```cpp
struct Settings {
    int max_retries = 3;        // mutable state lives in .data, not .rodata
};

void set_retries(Settings& settings, int value) noexcept {
    settings.max_retries = value;
}

int main() {
    Settings settings;
    std::cout << "before: " << settings.max_retries << '\n';
    set_retries(settings, 10);  // no cast at all; the type system agrees with the OS
    std::cout << "after:  " << settings.max_retries << '\n';
    return 0;
}
```
If a value is meant to change, do not declare it `const`; give it a home in writable memory (`.data`, or a local, or a member) and change it through the type system. `const_cast` is legitimate in exactly one situation — calling a const-incorrect API on an object that is *not* actually `const`, as the example's `legacy_length` shows — and never for "unlocking" a constant.

### Pitfall 4: A string literal chooses `bool` over `std::string`
**Buggy Snippet:**
```cpp
void configure(bool verbose) {
    std::cout << "verbose = " << std::boolalpha << verbose << '\n';
}

void configure(const std::string& profile) {
    std::cout << "profile = " << profile << '\n';
}

int main() {
    configure("production");    // Java picks String; C++ picks bool
    return 0;
}
```
**Symptom / Compiler Diagnostic:**
```text
$ g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4 && ./p4      # g++ 13: no warning at all
verbose = true

$ clang++ -std=c++20 -Wall -Wextra -Wstring-conversion p4_bug.cpp -o p4
p4_bug.cpp:14:15: warning: implicit conversion turns string literal into bool: 'const char[11]' to 'bool' [-Wstring-conversion]
   14 |     configure("production");    // Java picks String; C++ picks bool
      |     ~~~~~~~~~ ^~~~~~~~~~~~
```
**Underlying Cause:** `"production"` is not a `std::string`; it is an lvalue of type `const char[11]` (Diagram 6). Overload resolution (Diagram 10) must convert it to each candidate's parameter type and rank the sequences. For `configure(bool)`: array-to-pointer (exact-match category), then pointer-to-`bool` — a *standard* conversion sequence, rank 3. For `configure(const std::string&)`: array-to-pointer, then `std::string`'s converting constructor from `const char*` — a *user-defined* conversion, rank 4. A standard conversion always beats a user-defined one, so the compiler picks `bool`, emits a `test`/`setne` to turn the (non-null) address into `1`, and the call compiles with no diagnostic from g++. Java would pick `String` because its rules only consider widening and boxing and never consider `String → boolean`; C++ considers *any* pointer → `bool` a perfectly ordinary conversion (that is what makes `if (ptr)` work).

**Fix:**
```cpp
void configure(std::string_view profile) {
    std::cout << "profile = " << profile << '\n';
}

// const char* -> std::string_view would still be a user-defined conversion, which
// loses to the standard pointer->bool conversion.  An exact-match overload wins.
void configure(const char* profile) {
    configure(std::string_view{profile});
}

int main() {
    configure("production");
    configure(std::string{"staging"});   // std::string -> string_view (user-defined), bool not viable
    configure(true);
    return 0;
}
```
Give the literal an *exact* match. `const char*` after array-to-pointer decay is rank 1, better than either conversion, so the new overload wins and forwards. Alternatives at the call site — `configure(std::string{"production"})` or `using namespace std::literals; configure("production"s)` — also work, but a caller should not have to know. `std::string_view` alone does *not* fix it: `const char*` → `std::string_view` is still a user-defined conversion and still loses to `bool`.

## 5. Summary and Self-Assessment

### Core Takeaways

- **A type is a compile-time contract, not a run-time tag.** It fixes `sizeof`, the interpretation of the bits, and the instruction chosen for each operation (`setl` vs `setb`, `idiv` vs `div`, `cvttsd2si`, `movslq`). After compilation only widths and opcodes remain; sizes are ABI facts (LP64 here: `int` 4, `long` 8, pointers 8), and the `<cstdint>` names are aliases of those fundamental types — `std::uint8_t` *is* `unsigned char`, which is why `std::cout` prints it as a character.
- **Unsigned arithmetic is modular by definition; signed overflow is undefined by definition.** Rely on the first (hashes, counters, checksums); never test the second after the fact — g++ folds `x + 1 < x` to `false` even at `-O0`. Check the precondition (`a > INT_MAX - b`), widen, or use `-fsanitize=undefined` in test builds. Two's complement (mandated since C++20) is what makes signed → unsigned conversion a free bit-preserving relabel.
- **Nothing narrower than `int` is ever computed, and a signed operand next to an unsigned one becomes unsigned.** `uint8_t + uint8_t` is an `int`; `~a` is an `int`; `-1 < 1u` is `false`; `v.size() - 1` on an empty container is 2⁶⁴ − 1. Use `std::size_t` counters, keep additions on the side that cannot wrap, and reach for `std::cmp_less` when signs must mix.
- **Expressions carry a value category, and overload resolution consumes both type and category at compile time.** lvalues have identity, prvalues are pure results, xvalues are lvalues marked expiring by a zero-instruction cast (`std::move`). Overloads are chosen by conversion rank (exact > promotion > conversion > user-defined), never by "most specific type" — so `int` is ambiguous between `long` and `double`, and a string literal prefers `bool` over `std::string`. The choice is baked into a mangled symbol (`_ZN4demo9type_nameEPKc`) that encodes parameters but not the return type; `static_cast`/`reinterpret_cast`/`const_cast` each name one specific operation, and a C-style cast is whichever of them happens to compile.

### Guided Challenges

1. **The loop that never ends.** Write `for (std::uint8_t i = 0; i < 300; ++i) std::cout << static_cast<int>(i) << ' ';`, compile it with `g++ -std=c++20 -Wall -Wextra`, and read the warning g++ prints before you run it (then run it with a timeout). Explain, using Diagram 4 and Diagram 5, why the condition is what the warning says it is, why the program behaves the way it does, and what the smallest change to the counter's declaration is that makes the loop print 256 numbers and stop — then verify with `objdump -d` that the comparison is now a 32-bit `cmp`.
   **Hint:** In which type is `i < 300` evaluated after integer promotion, and what is the largest value `i` itself can ever hold when `++i` stores back into one byte?

2. **Mangling detective.** In one file declare (do not define) `void probe(const std::string&);`, `void probe(std::string&&);`, `void probe(long long);`, `void probe(unsigned char);` and `void probe(int*, const int*);`, call each once from `main`, and compile with `g++ -std=c++20 -c`. Using only `nm probe.o` (no `-C`) and Diagram 9, decode every `U probe…` symbol by hand — including the letters for `long long`, `unsigned char`, and `std::string` (which the ABI abbreviates) — and only then check yourself with `c++filt`. Finally add `int probe(long long);` and predict the compiler's exact complaint before you see it.
   **Hint:** The ABI's substitution rules give `std::string` a short alias beginning with `Ss`, and the return type you added is the one thing the mangled name does *not* contain.
