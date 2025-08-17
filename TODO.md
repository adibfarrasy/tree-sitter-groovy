# TODO: Grammar Issues to Fix

## Text Blocks
- Text blocks are currently being parsed as string literals instead of the dedicated `text_block` node
- The grammar rule exists but seems to have precedence issues with triple-quoted strings
- Example that fails:
  ```groovy
  """
  This is a text block
  with indentation
  """
  ```

## Empty Single-Quoted Strings
- Empty single-quoted strings (`''`) fail to parse due to `repeat1` requirement in grammar
- Grammar expects at least one character inside single quotes
- Consider changing to `repeat` instead of `repeat1` to allow empty strings

## Closure Parsing Issues
- Closures `{}` are being parsed as `block` instead of `closure` nodes
- Grammar has conflicts between `block` and `closure` rules (both use same `{}` syntax)
- Lambda expressions `x -> expr` are parsed instead of closure parameters
- Need to fix grammar precedence or conflicts to distinguish closures from blocks

## Future Improvements
- Add GString interpolation tests once grammar supports it
- Add closure parameter tests with complex syntax once closure parsing is fixed
- Add spread operator tests in various contexts