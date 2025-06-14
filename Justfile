default:
    @just --list

gen-test:
    @echo "Regenerating tree..."
    tree-sitter generate

    @echo "Running tests..."
    tree-sitter test

parse-examples:
    @echo "Generating test files for manual inspection..."
    #!/usr/bin/env bash
    for f in examples/*; do tree-sitter parse "$f" > "$(basename "$f" | sed 's/\([a-z0-9]\)\([A-Z]\)/\1_\2/g' | tr '[:upper:]' '[:lower:]')"; done

    @echo "Compiling errors..."
    grep -C 3 -H -n ERROR test_* > error.log || echo "No errors found."

full:
    just gen-test
    just parse-examples


