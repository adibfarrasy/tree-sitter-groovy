; Language keywords - RED
[
  "abstract"
  "break" 
  "case"
  "catch"
  "continue"
  "def"
  "default"
  "do"
  "else"
  "enum"
  "extends"
  "final"
  "finally"
  "for"
  "if"
  "implements"
  "import"
  "@interface"
  "native"
  "new"
  "package"
  "private"
  "protected"
  "public"
  "return"
  "static"
  "strictfp"
  "switch"
  "synchronized"
  "throw"
  "throws"
  "transient"
  "try"
  "volatile"
  "while"
] @keyword

; Boolean and special keywords
(true) @keyword
(false) @keyword
(this) @keyword
(super) @keyword
(null_literal) @keyword

; Primitive types - RED
(integral_type) @keyword
(boolean_type) @keyword
(floating_point_type) @keyword
(void_type) @keyword

; Annotations - GREEN
(marker_annotation) @preproc
(annotation) @preproc

; Class properties, function arguments and variables - BLUE
(parameter
  name: (identifier) @variable.parameter)

(catch_parameter
  name: (identifier) @variable.parameter)

(variable_declarator
  name: (identifier) @variable)

(field_access
  object: (identifier) @variable
  field: (identifier) @property)

(assignment_expression
  left: (identifier) @variable)

(enhanced_for_statement
  name: (identifier) @variable)


; Method invocations
(method_invocation
  object: (identifier) @variable
  name: (identifier) @function.call)

; Method calls on field access (e.g., obj.field.method())
(method_invocation
  object: (field_access
    object: (identifier) @variable)
  name: (identifier) @function.call)

; Simple method calls (no object)
(method_invocation
  name: (identifier) @function.call)

; Numbers - PINK
[
  (decimal_integer_literal)
  (hex_integer_literal)
  (octal_integer_literal)
  (binary_integer_literal)
  (decimal_floating_point_literal)
  (hex_floating_point_literal)
] @number

; Method names
(function_declaration
  name: (identifier) @function)

(method_invocation
  name: (identifier) @function.call)

; Type identifiers
(type_identifier) @type
(scoped_type_identifier) @type

; String literals - GREEN  
(string_literal) @string
(text_block) @string

(string_literal
  (string_interpolation) @embedded)

(string_interpolation
  (identifier) @variable)

"$" @punctuation.special
"${" @punctuation.special
"}" @punctuation.special

; Comments
(line_comment) @comment
(block_comment) @comment

; Operators
[
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "&="
  "^="
  "|="
  "<<="
  ">>="
  ">>>="
  "+"
  "-"
  "*"
  "/"
  "%"
  "++"
  "--"
  "&&"
  "||"
  "&"
  "|"
  "^"
  "~"
  "<<"
  ">>"
  ">>>"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "!"
  "?"
  ":"
  "instanceof"
] @operator

; Punctuation
[
  ";"
  ","
  "."
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

; Constructor calls
(object_creation_expression
  type: (type_identifier) @constructor)

(object_creation_expression
  type: (generic_type
    (type_identifier) @constructor))

; Constants (ALL_CAPS identifiers)
((identifier) @constant
 (#match? @constant "^[A-Z][A-Z_0-9]*$"))

; Field declarations
(field_declaration
  declarator: (variable_declarator
    name: (identifier) @property))

; Class names in declarations
(class_declaration
  name: (identifier) @type.definition)

(interface_declaration 
  name: (identifier) @type.definition)

(enum_declaration
  name: (identifier) @type.definition)

(annotation_type_declaration
  name: (identifier) @type.definition)

; Import statements
(import_declaration
  (scoped_identifier) @namespace)

(import_declaration
  (identifier) @namespace)

; Package declarations
(package_declaration
  (scoped_identifier) @namespace)

; Exception types in catch
(catch_type
  (type_identifier) @type.builtin)

; Generic type parameters
(type_parameter
  (type_identifier) @type.parameter)

; Closure parameters
(closure
  (parameter
    name: (identifier) @variable.parameter))

; Enum constants
(enum_body
  (enum_constant
    name: (identifier) @constant))

; Specific annotation names (as identifiers within annotations)
(annotation
  name: (identifier) @attribute)

(annotation 
  name: (scoped_identifier) @attribute)

(marker_annotation
  name: (identifier) @attribute)

(marker_annotation 
  name: (scoped_identifier) @attribute)
