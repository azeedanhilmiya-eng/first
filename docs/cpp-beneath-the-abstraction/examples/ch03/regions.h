// regions.h -- ask the kernel which memory mapping contains an address.
//
// Linux publishes every process's memory map as text in /proc/self/maps. This
// tiny helper lets the example prove, from a live process, where each kind of
// object actually lives instead of asking you to take a diagram on faith.
#ifndef CH03_REGIONS_H
#define CH03_REGIONS_H

#include <cstdint>
#include <string>

namespace mem {

// Describes the mapping that contains `address`, e.g. "the executable (r-x)",
// "[heap] (rw-)", "[stack] (rw-)", "a shared library (rw-)", "an anonymous mmap (rw-)".
[[nodiscard]] std::string region_of(std::uintptr_t address);

}  // namespace mem

#endif  // CH03_REGIONS_H
