# C++: From Beginner to Advanced: Beneath the Abstraction

A nine-chapter tutorial series for developers who already program in Python or Java and want to learn C++ by understanding what happens **in memory and at the hardware/OS level**, rather than by memorizing syntax. Every chapter is built around evidence from a real toolchain: compiler output, disassembly, sanitizer reports, and probe programs whose output is committed next to the text.

## Who this is for

You know control flow, functions, and object-oriented programming in Python or Java. You have never written C++, or you have and it felt like memorizing rules with no reasons. You want to know why a program segfaults, what a vtable is, where a `std::vector` keeps its elements, and what `std::move` actually does to the bytes.

## How the series works

- **Standard:** C++20 (`-std=c++20`). Everything was verified with **g++ 13.3 (libstdc++ 13) on x86-64 Linux**; the examples also build with clang++ 18 and produce identical output. Where a fact is ABI- or implementation-specific (Itanium C++ ABI layout, libstdc++ growth factors, glibc allocator behavior) the text says so.
- **Every chapter follows the same five parts:**
  1. *Motivation and Mental Model*: the one-sentence core problem, an everyday analogy, and an explicit contrast with Python and Java.
  2. *Deep Dive and Low-Level Mechanics*: compile-time versus run-time behavior step by step, with ASCII memory diagrams and captured tool output.
  3. *Complete, Production-Grade Code Example*: a self-contained C++20 program (source shown byte-for-byte) and its exact terminal output.
  4. *Pitfalls and Anti-Patterns*: three or four real bugs, each with the actual compiler diagnostic or sanitizer report, the low-level cause, and the fix.
  5. *Summary and Self-Assessment*: dense takeaways and guided challenges with hints.
- **Bilingual terminology:** the first time a chapter uses a technical term it is written as **Term (中文)**, for example **Undefined Behavior (未定义行为)**. The glossary at the bottom of this page lists every term with the chapter that introduces it.

## Table of contents

| # | Chapter | What you will be able to explain afterwards |
|---|---------|---------------------------------------------|
| 1 | [The Build Pipeline and Toolchain](01-build-pipeline-and-toolchain.md) | Preprocessing, compilation, assembly, and linking as four separate tools; object files as "code with holes"; symbol tables, relocations, and name mangling; ELF sections and segments (and PE on Windows); what `-std=c++20 -Wall -Wextra -O2` each change. |
| 2 | [Type System and Low-Level Primitives](02-type-system-and-primitives.md) | Why a type is a compile-time contract; sizes and the LP64 model; two's complement; why unsigned wraps and signed overflow is undefined; integer promotion and mixed-sign comparisons; value categories; the four named casts; overloading, mangling, and overload resolution. |
| 3 | [Pointers, References, and Memory Architecture](03-pointers-references-and-memory.md) | The process address space (text, rodata, data, BSS, heap, mmap, stack) as read from `/proc/self/maps`; stack frames from the real prologue and epilogue; scaled pointer arithmetic; what a reference compiles to; alignment and padding. |
| 4 | [Object Lifecycle and Class Invariants](04-object-lifecycle-and-raii.md) | Where and when objects are constructed and destroyed; member initializer lists and declaration order; RAII across stack unwinding; the Rule of Zero/Three/Five; copy versus move at the byte level; copy elision. |
| 5 | [Polymorphism and Dynamic Dispatch](05-polymorphism-and-dynamic-dispatch.md) | Inheritance layout; the vtable and vptr as g++ emits them; what a virtual call compiles to; virtual destructors; RTTI, `dynamic_cast` and `typeid`; object slicing; this-pointer adjustment under multiple inheritance. |
| 6 | [Modern Resource Management](06-modern-resource-management.md) | Ownership as a type property; `unique_ptr` at the instruction level; custom deleters; the `shared_ptr` control block measured with a counting `operator new`; `weak_ptr` and the two reference counts; breaking cycles; deterministic destruction versus garbage collection. |
| 7 | [Templates and Generic Metaprogramming](07-templates-and-generic-programming.md) | The instantiation model (one function per type, in the using translation unit); deduction and CTAD; C++20 concepts and how they change error messages; SFINAE; full and partial specialization; `constexpr`/`consteval` verified in the disassembly; variadic templates and folds. |
| 8 | [The Standard Template Library (STL)](08-standard-template-library.md) | `std::vector` growth and reallocation measured; iterator invalidation rules per container; `std::map` tree nodes versus `std::unordered_map` buckets and chains; cache locality with a benchmark; algorithms and ranges; `emplace` versus `push`. |
| 9 | [Modern C++ Semantics and Concurrency](09-modern-semantics-and-concurrency.md) | Rvalue references and why a named one is an lvalue; `std::move` as a cast; forwarding references and reference collapsing; lambdas as compiler-written classes with measured sizes; `std::jthread`, mutexes, `std::scoped_lock`, atomics, data races, and deadlocks with ThreadSanitizer evidence. |

## Suggested learning path

Read the chapters in order; each one leans on the previous. If you must skip, the dependency graph is:

```text
1 Build pipeline ──▶ 2 Types ──▶ 3 Memory ──▶ 4 Object lifecycle ──▶ 5 Polymorphism
                                                     │                      │
                                                     ▼                      ▼
                                              6 Smart pointers ──▶ 7 Templates ──▶ 8 STL ──▶ 9 Move, lambdas, threads
```

Chapter 3 (memory) and Chapter 4 (lifecycle) are the foundation for everything after them; do not skip those two.

## Building and running the examples

Every chapter's example lives in `examples/chNN/` with its exact expected output, and every pitfall is a complete program you can compile yourself:

```text
docs/cpp-beneath-the-abstraction/
  NN-<chapter>.md              the chapter
  examples/chNN/*.cpp, *.h     the chapter's main example (shown byte-for-byte in section 3)
  examples/chNN/expected_output.txt
  examples/chNN/pitfalls/pK_bug.cpp / pK_fix.cpp   the buggy and fixed programs of pitfall K
  verify.sh                    builds every example and diffs its output against expected_output.txt
  check_sync.py                proves the code blocks in each chapter are identical to the files on disk
```

```bash
cd docs/cpp-beneath-the-abstraction
./verify.sh            # all chapters; or ./verify.sh ch03 for one
./check_sync.py        # all chapters; or ./check_sync.py ch03

# one chapter by hand, with the flags the series uses everywhere:
g++ -std=c++20 -Wall -Wextra examples/ch04/*.cpp -o main && ./main

# a pitfall, with the sanitizer the chapter used to diagnose it:
g++ -std=c++20 -Wall -Wextra -g -fsanitize=address,undefined examples/ch03/pitfalls/p2_bug.cpp -o p2 && ./p2
```

`verify.sh` compiles with `-std=c++20 -Wall -Wextra -Wpedantic -Werror -O0 -g -pthread`; every example is warning-free under those flags. The pitfalls use whatever flags their header comment states, because some bugs only show at `-O2` and some only under `-fsanitize=address`, `undefined`, or `thread`.

## Tools you will meet

`g++ -E / -S / -c`, `nm -C`, `readelf`, `objdump -d -C`, `size`, `ldd`, `c++filt`, `-fdump-lang-class`, `-fno-elide-constructors`, `-fsanitize=address`, `-fsanitize=undefined`, `-fsanitize=thread`, `valgrind`, `gdb`, and `/proc/self/maps`. Each is introduced where it first provides evidence.

## Glossary (English / 中文)

Every term below is glossed in the chapter listed on its first mention there; later chapters use the English term alone.

| English | 中文 | First explained in |
|---------|------|--------------------|
| ABI (Application Binary Interface) | 应用二进制接口 | Chapter 2 |
| Abstract Class | 抽象类 | Chapter 5 |
| Access Specifier | 访问说明符 | Chapter 4 |
| Address Space | 地址空间 | Chapter 2 |
| Address Space Layout Randomization | 地址空间布局随机化 | Chapter 3 |
| Algorithms | 算法 | Chapter 8 |
| Amortized Complexity | 摊还复杂度 | Chapter 8 |
| Assembler | 汇编器 | Chapter 1 |
| Atomic Operation | 原子操作 | Chapter 9 |
| Base Class | 基类 | Chapter 5 |
| BSS Segment | 未初始化数据段 | Chapter 1 |
| Bucket | 桶 | Chapter 8 |
| Cache Lines | 缓存行 | Chapter 8 |
| Cache Locality | 缓存局部性 | Chapter 8 |
| Calling Convention | 调用约定 | Chapter 1 |
| Capacity | 容量 | Chapter 8 |
| Capture | 捕获 | Chapter 9 |
| Class | 类 | Chapter 4 |
| Class Invariant | 类不变量 | Chapter 4 |
| Class Template | 类模板 | Chapter 7 |
| Closure | 闭包 | Chapter 9 |
| Compile Time | 编译期 | Chapter 1 |
| Compiler | 编译器 | Chapter 1 |
| Concept | 概念 | Chapter 7 |
| Concepts | 概念 | Chapter 7 |
| Constant Expression | 常量表达式 | Chapter 2 |
| Constraint | 约束 | Chapter 7 |
| Constructor | 构造函数 | Chapter 4 |
| Container | 容器 | Chapter 8 |
| Control Block | 控制块 | Chapter 6 |
| Copy Assignment Operator | 拷贝赋值运算符 | Chapter 4 |
| Copy Constructor | 拷贝构造函数 | Chapter 4 |
| Copy Elision | 拷贝省略 | Chapter 2 |
| Critical Section | 临界区 | Chapter 9 |
| Cyclic Reference | 循环引用 | Chapter 6 |
| Dangling Pointer | 悬垂指针 | Chapter 3 |
| Data Race | 数据竞争 | Chapter 9 |
| Data Segment | 数据段 | Chapter 1 |
| Deadlock | 死锁 | Chapter 9 |
| Deep Copy | 深拷贝 | Chapter 4 |
| Dereference | 解引用 | Chapter 2 |
| Derived Class | 派生类 | Chapter 5 |
| Destructor | 析构函数 | Chapter 4 |
| Deterministic Destruction | 确定性析构 | Chapter 6 |
| Dynamic Dispatch | 动态分发 | Chapter 5 |
| Dynamic Loader | 动态加载器 | Chapter 1 |
| Dynamic Type | 动态类型 | Chapter 5 |
| ELF (Executable and Linkable Format) | 可执行与可链接格式 | Chapter 1 |
| Exception | 异常 | Chapter 4 |
| Executable | 可执行文件 | Chapter 1 |
| Fold Expression | 折叠表达式 | Chapter 7 |
| Forwarding Reference | 转发引用 | Chapter 9 |
| Function Overloading | 函数重载 | Chapter 1 |
| Function Signature | 函数签名 | Chapter 2 |
| Garbage Collection | 垃圾回收 | Chapter 2 |
| glvalue | 泛左值 | Chapter 2 |
| Hash Table | 哈希表 | Chapter 8 |
| Header File | 头文件 | Chapter 1 |
| Heap | 堆 | Chapter 3 |
| Implementation-Defined Behavior | 实现定义行为 | Chapter 2 |
| Implicit Conversion | 隐式转换 | Chapter 2 |
| Include Guard | 头文件保护 | Chapter 1 |
| Inheritance | 继承 | Chapter 5 |
| Integer Overflow | 整数溢出 | Chapter 2 |
| Integer Promotion | 整型提升 | Chapter 2 |
| Iterator Invalidation | 迭代器失效 | Chapter 8 |
| Iterators | 迭代器 | Chapter 8 |
| Lambda Expression | Lambda 表达式 | Chapter 9 |
| Lifetime | 生命周期 | Chapter 3 |
| Linker | 链接器 | Chapter 1 |
| Load Factor | 负载因子 | Chapter 8 |
| Lock | 锁 | Chapter 9 |
| lvalue | 左值 | Chapter 2 |
| Macro | 宏 | Chapter 1 |
| Member Initializer List | 成员初始化列表 | Chapter 4 |
| Memory Alignment | 内存对齐 | Chapter 3 |
| Memory Leak | 内存泄漏 | Chapter 3 |
| Memory Order | 内存序 | Chapter 9 |
| Metaprogramming | 元编程 | Chapter 7 |
| Move Assignment Operator | 移动赋值运算符 | Chapter 4 |
| Move Constructor | 移动构造函数 | Chapter 4 |
| Move Semantics | 移动语义 | Chapter 2 |
| Multiple Inheritance | 多重继承 | Chapter 5 |
| Mutex | 互斥锁 | Chapter 9 |
| Name Mangling | 名称修饰 | Chapter 1 |
| Narrowing Conversion | 窄化转换 | Chapter 2 |
| Non-Type Template Parameter | 非类型模板参数 | Chapter 7 |
| Null Pointer | 空指针 | Chapter 2 |
| Object File | 目标文件 | Chapter 1 |
| Object Slicing | 对象切片 | Chapter 5 |
| One Definition Rule | 单一定义规则 | Chapter 1 |
| Overload Resolution | 重载决议 | Chapter 2 |
| Ownership | 所有权 | Chapter 6 |
| Padding | 填充 | Chapter 3 |
| Page | 页 | Chapter 2 |
| Page Table | 页表 | Chapter 3 |
| Partial Specializations | 偏特化 | Chapter 7 |
| PE (Portable Executable) | 可移植可执行文件格式 | Chapter 1 |
| Perfect Forwarding | 完美转发 | Chapter 9 |
| Pointer | 指针 | Chapter 3 |
| Pointer Arithmetic | 指针算术 | Chapter 3 |
| Position-Independent Executable | 位置无关可执行文件 | Chapter 1 |
| Preprocessor | 预处理器 | Chapter 1 |
| prvalue | 纯右值 | Chapter 2 |
| Pure Virtual Function | 纯虚函数 | Chapter 5 |
| Race Condition | 竞态条件 | Chapter 9 |
| RAII (Resource Acquisition Is Initialization) | 资源获取即初始化 | Chapter 4 |
| Ranges | 范围 | Chapter 8 |
| Red-Black Tree | 红黑树 | Chapter 8 |
| Reference | 引用 | Chapter 2 |
| Reference Collapsing | 引用折叠 | Chapter 9 |
| Reference Count | 引用计数 | Chapter 2 |
| Register | 寄存器 | Chapter 3 |
| Rehash | 重哈希 | Chapter 8 |
| Relocation | 重定位 | Chapter 1 |
| Return Address | 返回地址 | Chapter 3 |
| RTTI (Run-Time Type Information) | 运行时类型信息 | Chapter 2 |
| Rule of Five | 五法则 | Chapter 4 |
| Rule of Three | 三法则 | Chapter 4 |
| Rule of Zero | 零法则 | Chapter 4 |
| Run Time | 运行期 | Chapter 1 |
| rvalue | 右值 | Chapter 2 |
| Rvalue Reference | 右值引用 | Chapter 4 |
| Scope | 作用域 | Chapter 4 |
| Sections | 节 | Chapter 1 |
| Segmentation Fault | 段错误 | Chapter 2 |
| Segments | 段 | Chapter 1 |
| SFINAE (Substitution Failure Is Not An Error) | 替换失败不是错误 | Chapter 7 |
| Shallow Copy | 浅拷贝 | Chapter 4 |
| Shared Library | 共享库 | Chapter 1 |
| Shared Ownership | 共享所有权 | Chapter 6 |
| Signed | 有符号 | Chapter 2 |
| Size | 大小 | Chapter 8 |
| Smart Pointers | 智能指针 | Chapter 6 |
| Stack | 栈 | Chapter 3 |
| Stack Frame | 栈帧 | Chapter 3 |
| Stack Unwinding | 栈展开 | Chapter 4 |
| Standard-Layout Types | 标准布局类型 | Chapter 4 |
| Static Dispatch | 静态分发 | Chapter 5 |
| Static Library | 静态库 | Chapter 1 |
| Static Type | 静态类型 | Chapter 5 |
| Storage Duration | 存储期 | Chapter 3 |
| Strict Aliasing | 严格别名 | Chapter 2 |
| Struct | 结构体 | Chapter 4 |
| Symbol | 符号 | Chapter 1 |
| Symbol Table | 符号表 | Chapter 1 |
| Template | 模板 | Chapter 7 |
| Template Argument Deduction | 模板实参推导 | Chapter 7 |
| Template Instantiation | 模板实例化 | Chapter 7 |
| Template Specialization | 模板特化 | Chapter 7 |
| Temporary Object | 临时对象 | Chapter 2 |
| Text Segment | 代码段 | Chapter 1 |
| Thread | 线程 | Chapter 9 |
| Translation Unit | 翻译单元 | Chapter 1 |
| Two's Complement | 补码 | Chapter 2 |
| Type Cast | 类型转换 | Chapter 2 |
| Type Erasure | 类型擦除 | Chapter 9 |
| Undefined Behavior | 未定义行为 | Chapter 2 |
| Unique Ownership | 独占所有权 | Chapter 6 |
| Unsigned | 无符号 | Chapter 2 |
| Value Category | 值类别 | Chapter 2 |
| Variadic Template | 变参模板 | Chapter 7 |
| Virtual Destructor | 虚析构函数 | Chapter 5 |
| Virtual Functions | 虚函数 | Chapter 5 |
| Virtual Memory | 虚拟内存 | Chapter 3 |
| Virtual Table (vtable) | 虚函数表 | Chapter 5 |
| Virtual Table Pointer (vptr) | 虚函数表指针 | Chapter 5 |
| Weak Reference | 弱引用 | Chapter 6 |
| xvalue | 将亡值 | Chapter 2 |
