// p4_fix.cpp -- give the key an equality and a hash; the table can now place and find it.
//
//   g++ -std=c++20 -Wall -Wextra p4_fix.cpp -o p4_fix && ./p4_fix
#include <cstddef>
#include <functional>
#include <iostream>
#include <unordered_map>

struct GridPoint {
    int x;
    int y;
    bool operator==(const GridPoint&) const = default;   // C++20: memberwise equality
};

template <>
struct std::hash<GridPoint> {                              // full specialization of the standard trait
    std::size_t operator()(const GridPoint& p) const noexcept {
        return std::hash<int>{}(p.x) ^ (std::hash<int>{}(p.y) << 1);   // combine the two fields
    }
};

int main() {
    std::unordered_map<GridPoint, int> visits;
    visits[GridPoint{1, 2}] = 1;
    ++visits[GridPoint{1, 2}];
    std::cout << "entries " << visits.size() << ", visits at (1,2) = " << visits[GridPoint{1, 2}] << '\n';
    return 0;
}
