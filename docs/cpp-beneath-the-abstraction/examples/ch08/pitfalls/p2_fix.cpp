// p2_fix.cpp -- look up without inserting: find(), contains(), or at().
//
//   g++ -std=c++20 -Wall -Wextra p2_fix.cpp -o p2_fix && ./p2_fix
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> stock{{"apple", 3}};
    const char* wanted[] = {"apple", "pear", "plum"};
    for (const char* item : wanted) {
        if (const auto it = stock.find(item); it != stock.end() && it->second > 0) {
            std::cout << item << " in stock\n";
        }
    }
    std::cout << "contains(\"pear\") = " << std::boolalpha << stock.contains("pear") << '\n';   // C++20
    std::cout << "distinct items now tracked: " << stock.size() << '\n';
    return 0;
}
