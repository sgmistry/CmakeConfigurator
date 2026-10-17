#include <iostream>
#include "calculator.h"

int main() {
    std::cout << "=== CMake GUI Configurator & Build Demo ===" << std::endl;
    double a = 12.5;
    double b = 4.2;
    std::cout << a << " + " << b << " = " << Calculator::add(a, b) << std::endl;
    std::cout << a << " - " << b << " = " << Calculator::subtract(a, b) << std::endl;
    std::cout << a << " * " << b << " = " << Calculator::multiply(a, b) << std::endl;
    std::cout << a << " / " << b << " = " << Calculator::divide(a, b) << std::endl;
    std::cout << "Build successful and running!" << std::endl;
    return 0;
}

