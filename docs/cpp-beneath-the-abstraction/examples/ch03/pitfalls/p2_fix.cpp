// p2_fix.cpp -- let the container carry its size; iterate without an index.
//
//   g++ -std=c++20 -Wall -Wextra p2_fix.cpp -o p2_fix && ./p2_fix
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    const std::vector<int> scores{90, 85, 77, 68};   // size travels with the data
    int sum = 0;
    for (int score : scores) {                       // exactly scores.size() iterations
        sum += score;
    }
    std::cout << "sum = " << sum << ", average = " << sum / static_cast<int>(scores.size()) << '\n';
    // When an index is unavoidable, .at() checks it and throws std::out_of_range.
    std::cout << "scores.at(3) = " << scores.at(3) << '\n';
    return 0;
}
