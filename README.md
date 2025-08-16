# tree-sitter-groovy

A comprehensive [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the [Groovy](https://groovy-lang.org/) programming language.

## Features

- Complete Groovy syntax support including:
  - Classes, interfaces, enums, and annotations
  - Method declarations and invocations
  - Variable declarations and field access
  - Control flow statements (if/else, for, while, switch)
  - Closures and lambda expressions
  - String interpolation and multi-line strings
  - Comments and documentation
- Syntax highlighting with semantic token classification
- Works with popular editors supporting Tree-sitter

## Installation

### Prerequisites

- [Tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/creating-parsers#installation)
- Node.js (for grammar compilation)
- C compiler (gcc/clang)

### Building from Source

```bash
git clone https://github.com/adibfarrasy/tree-sitter-groovy.git
cd tree-sitter-groovy
tree-sitter generate
tree-sitter test
```

## Editor Integration

### Neovim (with nvim-treesitter)

1. Add parser configuration to your Neovim config:

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.groovy = {
  install_info = {
    url = "https://github.com/adibfarrasy/tree-sitter-groovy",
    files = {"src/parser.c"},
    branch = "main",
  },
  filetype = "groovy",
}
```

2. Install the parser:
```vim
:TSInstall groovy
```

### Helix Editor

Add to your `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "groovy"
scope = "source.groovy"
injection-regex = "groovy"
file-types = ["groovy", "gvy", "gy", "gsh", "gradle"]
roots = ["settings.gradle", "build.gradle"]
comment-token = "//"
indent = { tab-width = 4, unit = "    " }

[[grammar]]
name = "groovy"
source = { git = "https://github.com/adibfarrasy/tree-sitter-groovy", rev = "main" }
```

### VS Code

Install the Tree-sitter extension and configure in `settings.json`:

```json
{
  "tree-sitter.grammars": [
    {
      "name": "groovy",
      "path": "path/to/tree-sitter-groovy"
    }
  ]
}
```

## Syntax Highlighting

The grammar includes comprehensive syntax highlighting with the following token classifications:

- **Keywords**: `class`, `def`, `if`, `else`, `return`, primitive types, etc.
- **Strings**: String literals and text blocks
- **Comments**: Line and block comments
- **Numbers**: Integer and floating-point literals
- **Annotations**: `@Override`, `@Service`, etc.
- **Variables**: Method parameters, local variables, field access
- **Functions**: Method names and invocations
- **Types**: Class names and type identifiers
- **Constants**: ALL_CAPS identifiers and enum values
- **Operators**: Arithmetic, logical, and assignment operators

## Testing

Run the test suite:

```bash
tree-sitter test
```

Test syntax highlighting:

```bash
tree-sitter highlight examples/TestClass.groovy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new syntax
5. Run `tree-sitter test` to verify
6. Submit a pull request

## File Types

This grammar recognizes the following file extensions:
- `.groovy`
- `.gvy` 
- `.gy`
- `.gsh`
- `.gradle` (Gradle build scripts)

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

## Acknowledgments

Based partially on [this unmaintained project](https://github.com/codieboomboom/tree-sitter-groovy) with significant improvements and modernization.
