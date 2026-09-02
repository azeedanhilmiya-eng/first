// p2_bug.cpp -- checking for a key with operator[] inserts it.
//
//   g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug && ./p2_bug
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> stock{{"apple", 3}};
    const char* wanted[] = {"apple", "pear", "plum"};
    for (const char* item : wanted) {
        if (stock[item] > 0) {        // stock["pear"] default-inserts {"pear", 0} and returns 0
            std::cout << item << " in stock\n";
        }
    }
    std::cout << "distinct items now tracked: " << stock.size() << '\n';   // expected 1
    return 0;
}
