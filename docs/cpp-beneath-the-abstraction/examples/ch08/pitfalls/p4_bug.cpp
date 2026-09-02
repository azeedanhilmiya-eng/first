// p4_bug.cpp -- an unordered_map keyed by a type that has no std::hash.
//
//   g++ -std=c++20 -Wall -Wextra p4_bug.cpp -o p4_bug
#include <iostream>
#include <unordered_map>

struct GridPoint {
    int x;
    int y;
};

int main() {
    std::unordered_map<GridPoint, int> visits;   // needs std::hash<GridPoint> and operator==
    visits[GridPoint{1, 2}] = 1;
    std::cout << visits.size() << '\n';
    return 0;
}
