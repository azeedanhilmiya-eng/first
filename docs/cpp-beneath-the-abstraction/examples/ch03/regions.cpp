// regions.cpp -- parse /proc/self/maps and classify one address.
#include "regions.h"

#include <cstdint>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <string>

namespace mem {

std::string region_of(std::uintptr_t address) {
    // Each line: "start-end perms offset dev inode [path]", addresses in hex.
    std::ifstream maps("/proc/self/maps");
    const std::string self = std::filesystem::read_symlink("/proc/self/exe").string();
    std::string line;
    while (std::getline(maps, line)) {
        std::istringstream fields(line);
        std::string range, perms, offset, dev, inode, path;
        fields >> range >> perms >> offset >> dev >> inode;
        std::getline(fields >> std::ws, path);  // the path is optional and may be empty

        const auto dash = range.find('-');
        const auto start = std::stoull(range.substr(0, dash), nullptr, 16);
        const auto end = std::stoull(range.substr(dash + 1), nullptr, 16);
        if (address < start || address >= end) continue;

        std::string what;
        if (path == self)                                  what = "the executable";
        else if (path == "[heap]" || path == "[stack]")    what = path;
        else if (path.find(".so") != std::string::npos)    what = "a shared library";
        else if (path.empty())                             what = "an anonymous mmap";
        else                                               what = path;
        return what + " (" + perms.substr(0, 3) + ")";     // keep r/w/x, drop the p/s flag
    }
    return "not mapped";
}

}  // namespace mem
