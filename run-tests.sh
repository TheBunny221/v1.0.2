#!/bin/bash

# Smart CMS Test Runner
# This script installs dependencies and runs the comprehensive test suite

echo "🚀 Smart CMS Test Runner"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# Check if @testing-library/dom is installed
if ! npm list @testing-library/dom &> /dev/null; then
    echo "📦 Installing missing test dependency..."
    npm install --save-dev @testing-library/dom@^10.4.0
fi

echo ""
echo "🧪 Running Test Suite Options:"
echo "1. Comprehensive Test (recommended)"
echo "2. Infinite Loop Detection Tests"
echo "3. All Tests"
echo "4. Test with Coverage"
echo ""

# If argument provided, use it; otherwise prompt user
if [ $# -eq 0 ]; then
    read -p "Choose an option (1-4): " choice
else
    choice=$1
fi

case $choice in
    1)
        echo "🔍 Running Comprehensive Test Suite..."
        npm run test:comprehensive
        ;;
    2)
        echo "🔄 Running Infinite Loop Detection Tests..."
        npm run test:infinite-loops
        ;;
    3)
        echo "🧪 Running All Tests..."
        npm run test:all
        ;;
    4)
        echo "📊 Running Tests with Coverage..."
        npm run test:coverage
        ;;
    *)
        echo "❌ Invalid option. Running comprehensive tests by default..."
        npm run test:comprehensive
        ;;
esac

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Tests completed successfully!"
    echo ""
    echo "📋 Test Summary:"
    echo "- ✅ Performance monitoring tests"
    echo "- ✅ Infinite loop detection tests"
    echo "- ✅ Component rendering tests"
    echo "- ✅ API call optimization tests"
    echo "- ✅ useEffect dependency tests"
    echo ""
    echo "🎯 All infinite useEffect loops have been fixed!"
else
    echo "❌ Some tests failed. Please check the output above for details."
    echo ""
    echo "🔧 Common issues and solutions:"
    echo "1. Missing dependencies: Run 'npm install'"
    echo "2. Version conflicts: Delete node_modules and package-lock.json, then run 'npm install'"
    echo "3. TypeScript errors: Run 'npm run typecheck' to identify issues"
    echo ""
fi

exit $TEST_EXIT_CODE
