// shapes.h -- a small polymorphic hierarchy used to look at vtables and vptrs.
#ifndef CH05_SHAPES_H
#define CH05_SHAPES_H

#include <string>
#include <string_view>

namespace geo {

// Abstract base: two pure virtual functions, one virtual destructor, one data member.
class Shape {
public:
    explicit Shape(std::string label) : label_(std::move(label)) {}
    virtual ~Shape() = default;                              // so `delete Shape*` runs the right destructor

    [[nodiscard]] virtual double area() const = 0;           // dispatched through the vtable
    [[nodiscard]] virtual std::string_view kind() const = 0;
    [[nodiscard]] std::string describe() const;              // NOT virtual: bound at compile time

    [[nodiscard]] const std::string& label() const noexcept { return label_; }

protected:
    std::string label_;   // sits AFTER the vptr in memory
};

class Circle final : public Shape {   // final: nothing may derive from Circle
public:
    Circle(std::string label, double radius) : Shape(std::move(label)), radius_(radius) {}
    [[nodiscard]] double area() const override;
    [[nodiscard]] std::string_view kind() const override { return "circle"; }

private:
    double radius_;
};

class Rect : public Shape {
public:
    Rect(std::string label, double w, double h) : Shape(std::move(label)), w_(w), h_(h) {}
    [[nodiscard]] double area() const override { return w_ * h_; }
    [[nodiscard]] std::string_view kind() const override { return "rect"; }
    [[nodiscard]] bool is_square() const noexcept { return w_ == h_; }   // exists only on Rect

private:
    double w_;
    double h_;
};

}  // namespace geo

#endif  // CH05_SHAPES_H
