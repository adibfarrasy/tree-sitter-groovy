default:
    @just --list

gen-test:
    @echo "Regenerating tree..."
    tree-sitter generate

    @echo "Running tests..."
    tree-sitter test

parse-examples:
    #!/bin/bash
    echo "Generating test files for manual inspection..."
    echo "Working directory: $(pwd)"
    for f in examples/*; do
        echo "Parsing $f"
        tree-sitter parse "$f" > "test_$(basename "$f")"
    done
    echo "Files created:"
    ls -la *.parsed 2>/dev/null || echo "No .parsed files found"
    echo "Compiling errors..."
    if grep -C 3 -H -n ERROR test_* > error.log 2>/dev/null; then
        echo "Errors found in error.log"
    else
        echo "No errors found, creating empty error.log"
        echo "No errors found." > error.log
    fi
    echo "Final error.log:"
    ls -la error.log 2>/dev/null || echo "error.log not created"

try:
    just gen-test
    just parse-examples


