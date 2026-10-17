#include <cassert>
#include <iostream>
#include <cmath>
#include "calculator.h"

int main() {
    std::cout << "[RUNNING] Calculator unit tests..." << std::endl;

    assert(std::abs(Calculator::add(5.0, 3.0) - 8.0) < 1e-6);
    assert(std::abs(Calculator::subtract(10.0, 4.0) - 6.0) < 1e-6);
    assert(std::abs(Calculator::multiply(3.0, 7.0) - 21.0) < 1e-6);
    assert(std::abs(Calculator::divide(15.0, 3.0) - 5.0) < 1e-6);

    try {
        Calculator::divide(5.0, 0.0);
        assert(false); // Should throw
    } catch (const std::invalid_argument&) {
        // Expected
    }

    std::cout << "[PASSED] All 5 test assertions passed successfully!" << std::endl;
    return 0;
}

