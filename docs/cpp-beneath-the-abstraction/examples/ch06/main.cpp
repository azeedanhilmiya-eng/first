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
