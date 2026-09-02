// type_name.h -- a class template with full and partial specializations.
//
// The primary template answers "unknown"; each specialization is a separate
// definition the compiler picks by pattern-matching the type argument at
// compile time. No run-time type information is involved.
#ifndef CH07_TYPE_NAME_H
#define CH07_TYPE_NAME_H

#include <string>
#include <vector>

namespace meta {

template <typename T>
struct TypeName {                                   // primary template: the fallback
    static std::string get() { return "unknown"; }
};

template <> struct TypeName<int>    { static std::string get() { return "int"; } };     // full specializations
template <> struct TypeName<double> { static std::string get() { return "double"; } };
template <> struct TypeName<char>   { static std::string get() { return "char"; } };
template <> struct TypeName<std::string> { static std::string get() { return "std::string"; } };

template <typename T>
struct TypeName<T*> {                               // partial: matches ANY pointer type
    static std::string get() { return TypeName<T>::get() + "*"; }   // recursion on the pointee
};

template <typename T>
struct TypeName<const T> {                          // partial: matches const-qualified types
    static std::string get() { return "const " + TypeName<T>::get(); }
};

template <typename T>
struct TypeName<std::vector<T>> {                   // partial: matches every std::vector<T>
    static std::string get() { return "std::vector<" + TypeName<T>::get() + ">"; }
};

// Convenience: meta::type_name<T>() instead of meta::TypeName<T>::get()
template <typename T>
std::string type_name() { return TypeName<T>::get(); }

}  // namespace meta

#endif  // CH07_TYPE_NAME_H
