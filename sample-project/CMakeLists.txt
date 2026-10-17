cmake_minimum_required(VERSION 3.20)
project(ModernCalculator VERSION 1.2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Cache options configurable via GUI
option(BUILD_CALCULATOR_CLI "Build CLI executable" ON)
option(ENABLE_UNIT_TESTING "Build and register unit tests" ON)
set(CALCULATOR_PRECISION "HIGH" CACHE STRING "Precision level: LOW, MEDIUM, or HIGH")

# Core Library
add_library(calculator_core
    src/calculator.cpp
)
target_include_directories(calculator_core PUBLIC include)

# Standalone CLI Executable
if(BUILD_CALCULATOR_CLI)
    add_executable(calculator_cli
        src/main.cpp
    )
    target_link_libraries(calculator_cli PRIVATE calculator_core)
endif()

# Unit Tests
if(ENABLE_UNIT_TESTING)
    enable_testing()
    add_executable(calc_tests
        tests/test_main.cpp
    )
    target_link_libraries(calc_tests PRIVATE calculator_core)
    add_test(NAME CalculatorCoreTests COMMAND calc_tests)
endif()

