// p2_bug.cpp -- an off-by-one loop reads one element past a heap array.
//
//   g++ -std=c++20 -Wall -Wextra p2_bug.cpp -o p2_bug && ./p2_bug
//   g++ -std=c++20 -Wall -Wextra -g -fsanitize=address p2_bug.cpp -o p2_asan && ./p2_asan
#include <iostream>

int main() {
    int* scores = new int[4]{90, 85, 77, 68};   // 16 bytes on the heap
    int sum = 0;
    for (int i = 0; i <= 4; ++i) {              // <= : i reaches 4, and scores[4] is past the end
        sum += scores[i];
    }
    std::cout << "sum = " << sum << ", average = " << sum / 4 << '\n';
    delete[] scores;
    return 0;
}
