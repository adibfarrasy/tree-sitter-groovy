const DIGITS = token(sep1(/[0-9]+/, /_+/));
const HEX_DIGITS = token(sep1(/[A-Fa-f0-9]+/, "_"));
const PREC = {
  // https://introcs.cs.princeton.edu/java/11precedence/
  COMMENT: 0, // //  /*  */
  ASSIGN: 1, // =  += -=  *=  /=  %=  &=  ^=  |=  <<=  >>=  >>>=
  DECL: 2,
  ELEMENT_VAL: 2,
  TERNARY: 3, // ?:
  OR: 4, // ||
  AND: 5, // &&
  BIT_OR: 6, // |
  BIT_XOR: 7, // ^
  BIT_AND: 8, // &
  EQUALITY: 9, // ==  !=
  GENERIC: 10,
  REL: 10, // <  <=  >  >=  instanceof
  SHIFT: 11, // <<  >>  >>>
  ADD: 12, // +  -
  MULT: 13, // *  /  %
  CAST: 14, // (Type)
  UNARY: 15, // ++a  --a  a++  a--  +  -  !  ~
  OBJ_INST: 16, // new
  ARRAY: 16, // [Index]
  OBJ_ACCESS: 16, // .
  PARENS: 16, // (Expression)
  CLASS_LITERAL: 17, // .
  CALL: 18,
  LAMBDA: 19,

  TYPE: 2,
  SCOPED_TYPE: 1,
  PRIMARY_EXPR: 1,
};

module.exports = grammar({
  name: "groovy",

  extras: ($) => [$.line_comment, $.block_comment, /\s/, /\n/],

  supertypes: ($) => [
    $.expression,
    $.declaration,
    $.statement,
    $.primary_expression,
    $._literal,
    $._type,
    $.comment,
    $.module_directive,
  ],

  inline: ($) => [
    $._name,
    $._simple_type,
    $._class_body_declaration,
    $._variable_initializer,
  ],

  conflicts: ($) => [
    [$.expression, $.statement],
    [$.instanceof_expression],
    [$.annotated_type, $.array_type],
    [$.array_literal, $.map_literal],
    [$.expression, $.array_access],
    [$._method_declarator, $._variable_declarator_id],
    [$.primary_expression, $._unannotated_type],
    [$.primary_expression, $._unannotated_type, $.scoped_type_identifier],
    [$.primary_expression, $._unannotated_type],
    [$.modifiers, $.annotated_type, $.receiver_parameter],
    [
      $.module_declaration,
      $.package_declaration,
      $.modifiers,
      $.annotated_type,
    ],
  ],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat(choice($.statement, $.comment)),

    // Literals

    _literal: ($) =>
      choice(
        $.decimal_integer_literal,
        $.hex_integer_literal,
        $.octal_integer_literal,
        $.binary_integer_literal,
        $.decimal_floating_point_literal,
        $.hex_floating_point_literal,
        $.true,
        $.false,
        $.string_literal,
        $.text_block,
        $.null_literal,
      ),

    map_key: ($) => prec.left(choice(seq("(", $.identifier, ")"), $._literal)),

    map_entry: ($) =>
      seq(field("key", $.map_key), ":", field("value", $.expression)),

    map_literal: ($) => seq("[", choice(commaSep($.map_entry), ":"), "]"),

    array_literal: ($) => seq("[", commaSep($.expression), "]"),

    decimal_integer_literal: ($) =>
      token(seq(DIGITS, optional(choice("l", "L")))),

    hex_integer_literal: ($) =>
      token(seq(choice("0x", "0X"), HEX_DIGITS, optional(choice("l", "L")))),

    octal_integer_literal: ($) =>
      token(
        seq(
          choice("0o", "0O"),
          sep1(/[0-7]+/, "_"),
          optional(choice("l", "L")),
        ),
      ),

    binary_integer_literal: ($) =>
      token(
        seq(choice("0b", "0B"), sep1(/[01]+/, "_"), optional(choice("l", "L"))),
      ),

    decimal_floating_point_literal: ($) =>
      token(
        choice(
          seq(
            DIGITS,
            ".",
            optional(DIGITS),
            optional(seq(/[eE]/, optional(choice("-", "+")), DIGITS)),
            optional(/[fFdD]/),
          ),
          seq(
            ".",
            DIGITS,
            optional(seq(/[eE]/, optional(choice("-", "+")), DIGITS)),
            optional(/[fFdD]/),
          ),
          seq(
            DIGITS,
            /[eEpP]/,
            optional(choice("-", "+")),
            DIGITS,
            optional(/[fFdD]/),
          ),
          seq(
            DIGITS,
            optional(seq(/[eE]/, optional(choice("-", "+")), DIGITS)),
            /[fFdD]/,
          ),
        ),
      ),

    hex_floating_point_literal: ($) =>
      token(
        seq(
          choice("0x", "0X"),
          choice(
            seq(HEX_DIGITS, optional(".")),
            seq(optional(HEX_DIGITS), ".", HEX_DIGITS),
          ),
          optional(
            seq(
              /[eEpP]/,
              optional(choice("-", "+")),
              DIGITS,
              optional(/[fFdD]/),
            ),
          ),
        ),
      ),

    true: ($) => "true",

    false: ($) => "false",

    string_literal: ($) =>
      choice(
        $._sq_string_literal,
        $._dq_string_literal,
        $._triple_sq_string_literal,
        $._triple_dq_string_literal,
      ),

    _sq_string_literal: () =>
      token(seq("'", repeat1(choice(/[^\\'\n]/, /\\./, /\\\n/)), "'")),

    _dq_string_literal: () =>
      token(seq('"', repeat(choice(/[^\\"\n]/, /\\(.|\n)/)), '"')),

    _triple_sq_string_literal: () =>
      token(seq("'''", /([^'\\]|\\.|'[^']|''[^'])*/, "'''")),

    _triple_dq_string_literal: () =>
      token(seq('"""', /([^"\\$]|\\.|"[^"]|""[^"])*/, '"""')),

    text_block: ($) =>
      token(
        choice(
          seq(
            '"""',
            /\s*\n/,
            optional(repeat(choice(/[^\\"]/, /\\(.)/))),
            '"""',
          ),
        ),
      ),

    null_literal: ($) => "null",

    // Expressions

    expression: ($) =>
      choice(
        $.assignment_expression,
        $.binary_expression,
        $.instanceof_expression,
        $.lambda_expression,
        $.ternary_expression,
        $.update_expression,
        $.primary_expression,
        $.unary_expression,
        $.cast_expression,
        $.switch_expression,
      ),

    cast_expression: ($) =>
      prec.right(
        PREC.CAST,
        choice(
          seq(
            "(",
            choice(field("type", $._type), seq($._type, $.dimensions)),
            ")",
            field("value", $.expression),
          ),
          seq(
            field("value", $.expression),
            "as",
            choice(field("type", $._type), seq($._type, $.dimensions)),
          ),
        ),
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGN,
        seq(
          field("left", choice($.identifier, $.field_access, $.array_access)),
          field(
            "operator",
            choice(
              "=",
              "+=",
              "-=",
              "*=",
              "/=",
              "&=",
              "|=",
              "^=",
              "%=",
              "<<=",
              ">>=",
              ">>>=",
            ),
          ),
          field("right", $.expression),
        ),
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ["<", PREC.GENERIC + 1],
          [">", PREC.REL],
          [">=", PREC.REL],
          ["<=", PREC.REL],
          ["in", PREC.REL],
          ["==", PREC.EQUALITY],
          ["!=", PREC.EQUALITY],
          ["&&", PREC.AND],
          ["||", PREC.OR],
          ["+", PREC.ADD],
          ["-", PREC.ADD],
          ["*", PREC.MULT],
          ["/", PREC.MULT],
          ["&", PREC.BIT_AND],
          ["|", PREC.BIT_OR],
          ["^", PREC.BIT_XOR],
          ["%", PREC.MULT],
          ["<<", PREC.SHIFT],
          [">>", PREC.SHIFT],
          [">>>", PREC.SHIFT],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(
              field("left", $.expression),
              field("operator", operator),
              field("right", $.expression),
            ),
          ),
        ),
      ),

    instanceof_expression: ($) =>
      prec(
        PREC.REL,
        seq(
          field("left", $.expression),
          "instanceof",
          optional("final"),
          field("right", $._type),
          field("name", optional($.identifier)),
        ),
      ),

    lambda_expression: ($) =>
      prec.right(
        PREC.LAMBDA,
        seq(
          field(
            "parameters",
            choice($.identifier, $.formal_parameters, $.inferred_parameters),
          ),
          "->",
          field("body", choice($.expression, $.block)),
        ),
      ),

    inferred_parameters: ($) =>
      prec.left(seq("(", commaSep1($.identifier), ")")),

    ternary_expression: ($) =>
      prec.right(
        PREC.TERNARY,
        seq(
          field("condition", $.expression),
          "?",
          field("consequence", $.expression),
          ":",
          field("alternative", $.expression),
        ),
      ),

    unary_expression: ($) =>
      choice(
        ...[
          ["+", PREC.UNARY],
          ["-", PREC.UNARY],
          ["!", PREC.UNARY],
          ["~", PREC.UNARY],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(field("operator", operator), field("operand", $.expression)),
          ),
        ),
      ),

    update_expression: ($) =>
      prec.left(
        PREC.UNARY,
        choice(
          // Post (in|de)crement is evaluated before pre (in|de)crement
          seq($.expression, "++"),
          seq($.expression, "--"),
          seq("++", $.expression),
          seq("--", $.expression),
        ),
      ),

    primary_expression: ($) =>
      prec.left(
        PREC.PRIMARY_EXPR,
        choice(
          $._literal,
          $.array_literal,
          $.map_literal,
          $.class_literal,
          $.this,
          $.identifier,
          $.parenthesized_expression,
          $.object_creation_expression,
          $.field_access,
          $.array_access,
          $.method_invocation,
          $.method_reference,
          $.array_creation_expression,
          $.array_type,
        ),
      ),

    array_creation_expression: ($) =>
      prec.right(
        seq(
          "new",
          repeat($._annotation),
          field("type", $._simple_type),
          choice(
            seq(
              field("dimensions", repeat1($.dimensions_expr)),
              field("dimensions", optional($.dimensions)),
            ),
            seq(
              field("dimensions", $.dimensions),
              field("value", $.array_initializer),
            ),
          ),
        ),
      ),

    dimensions_expr: ($) => seq(repeat($._annotation), "[", $.expression, "]"),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    class_literal: ($) =>
      prec.dynamic(PREC.CLASS_LITERAL, seq($._unannotated_type, ".", "class")),

    object_creation_expression: ($) =>
      choice(
        $._unqualified_object_creation_expression,
        seq(
          $.primary_expression,
          ".",
          $._unqualified_object_creation_expression,
        ),
      ),

    _unqualified_object_creation_expression: ($) =>
      prec.right(
        seq(
          "new",
          field("type_arguments", optional($.type_arguments)),
          field("type", $._simple_type),
          $.object_creation_argument_list,
          optional($.class_body),
        ),
      ),

    object_creation_argument_list: ($) => seq("(", commaSep($.argument), ")"),

    argument: ($) =>
      choice(
        seq(field("name", $.identifier), ":", field("value", $.expression)),
        $.expression,
      ),

    field_access: ($) =>
      prec.dynamic(
        PREC.OBJ_ACCESS,
        seq(
          field("object", choice($.primary_expression, $.super)),
          optional(seq(".", $.super)),
          ".",
          field("field", choice($.identifier, $.this)),
        ),
      ),

    array_access: ($) =>
      seq(
        field("array", $.primary_expression),
        "[",
        field("index", $.expression),
        "]",
      ),

    method_invocation: ($) =>
      choice(
        prec.left(
          PREC.CALL,
          seq(field("name", $.identifier), field("arguments", $.argument_list)),
        ),
        prec.left(
          PREC.CALL,
          seq(
            choice(
              field("name", $.identifier),
              seq(
                field("object", choice($.primary_expression, $.super)),
                choice(".", "?.", "*."),
                optional(seq($.super, ".")),
                field("type_arguments", optional($.type_arguments)),
                field("name", $.identifier),
              ),
            ),
            choice(
              seq(
                field("arguments", $.argument_list),
                field("closure", $.closure),
              ),
              field("closure", $.closure),
              field("arguments", $.argument_list),
            ),
          ),
        ),
      ),

    argument_list: ($) => seq("(", commaSep($.expression), ")"),

    method_reference: ($) =>
      seq(
        choice($._type, $.primary_expression, $.super),
        "::",
        optional($.type_arguments),
        choice("new", $.identifier),
      ),

    type_arguments: ($) =>
      prec.right(
        PREC.GENERIC,
        seq(token.immediate("<"), commaSep(choice($._type, $.wildcard)), ">"),
      ),

    wildcard: ($) =>
      seq(repeat($._annotation), "?", optional($._wildcard_bounds)),

    _wildcard_bounds: ($) =>
      choice(seq("extends", $._type), seq($.super, $._type)),

    dimensions: ($) =>
      prec.right(repeat1(seq(repeat($._annotation), "[", "]"))),

    switch_expression: ($) =>
      seq(
        "switch",
        field("condition", $.parenthesized_expression),
        field("body", $.switch_block),
      ),

    switch_block: ($) =>
      seq(
        "{",
        choice(repeat($.switch_block_statement_group), repeat($.switch_rule)),
        "}",
      ),

    switch_block_statement_group: ($) =>
      prec.left(seq(repeat1(seq($.switch_label, ":")), repeat($.statement))),

    switch_rule: ($) =>
      seq(
        $.switch_label,
        "->",
        choice($.expression_statement, $.throw_statement, $.block),
      ),

    switch_label: ($) =>
      choice(seq("case", commaSep1($.expression)), "default"),

    // Statements

    statement: ($) =>
      choice(
        $.declaration,
        $.expression_statement,
        $.labeled_statement,
        $.if_statement,
        $.while_statement,
        $.enhanced_for_statement,
        $.for_statement,
        $.block,
        ";",
        $.assert_statement,
        $.do_statement,
        $.break_statement,
        $.continue_statement,
        $.return_statement,
        $.yield_statement,
        $.switch_expression,
        $.synchronized_statement,
        $.throw_statement,
        $.try_statement,
        $.try_with_resources_statement,
      ),

    block: ($) => seq("{", repeat($.statement), "}"),

    closure: ($) =>
      seq(
        "{",
        optional(seq(commaSep1($.identifier), "->")),
        repeat($.statement),
        "}",
      ),

    expression_statement: ($) => prec.right(seq($.expression, optional(";"))),

    labeled_statement: ($) => seq($.identifier, ":", $.statement),

    assert_statement: ($) =>
      choice(
        seq("assert", $.expression, ";"),
        seq("assert", $.expression, ":", $.expression, ";"),
      ),

    do_statement: ($) =>
      seq(
        "do",
        field("body", $.statement),
        "while",
        field("condition", $.parenthesized_expression),
        ";",
      ),

    break_statement: ($) =>
      prec.right(seq("break", optional($.identifier), optional(";"))),

    continue_statement: ($) =>
      prec.right(seq("continue", optional($.identifier), optional(";"))),

    return_statement: ($) =>
      prec.right(seq("return", optional($.expression), optional(";"))),

    yield_statement: ($) =>
      prec.right(seq("yield", $.expression, optional(";"))),

    synchronized_statement: ($) =>
      seq("synchronized", $.parenthesized_expression, field("body", $.block)),

    throw_statement: ($) =>
      prec.right(seq("throw", $.expression, optional(";"))),

    try_statement: ($) =>
      seq(
        "try",
        field("body", $.block),
        choice(
          repeat1($.catch_clause),
          seq(repeat($.catch_clause), $.finally_clause),
        ),
      ),

    catch_clause: ($) =>
      seq("catch", "(", $.catch_formal_parameter, ")", field("body", $.block)),

    catch_formal_parameter: ($) =>
      seq(optional($.modifiers), $.catch_type, $._variable_declarator_id),

    catch_type: ($) => sep1($._unannotated_type, "|"),

    finally_clause: ($) => seq("finally", $.block),

    try_with_resources_statement: ($) =>
      seq(
        "try",
        field("resources", $.resource_specification),
        field("body", $.block),
        repeat($.catch_clause),
        optional($.finally_clause),
      ),

    resource_specification: ($) =>
      seq("(", sep1($.resource, ";"), optional(";"), ")"),

    resource: ($) =>
      choice(
        seq(
          optional($.modifiers),
          field("type", $._unannotated_type),
          $._variable_declarator_id,
          "=",
          field("value", $.expression),
        ),
        $.identifier,
        $.field_access,
      ),

    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $.parenthesized_expression),
          field("consequence", $.statement),
          optional(seq("else", field("alternative", $.statement))),
        ),
      ),

    while_statement: ($) =>
      seq(
        "while",
        field("condition", $.parenthesized_expression),
        field("body", $.statement),
      ),

    for_statement: ($) =>
      seq(
        "for",
        "(",
        choice(
          field("init", $.variable_declaration),
          seq(commaSep(field("init", $.expression)), ";"),
        ),
        field("condition", optional($.expression)),
        ";",
        commaSep(field("update", $.expression)),
        ")",
        field("body", $.statement),
      ),

    enhanced_for_statement: ($) =>
      seq(
        "for",
        "(",
        seq(
          optional($.modifiers),
          field("type", $._unannotated_type),
          $._variable_declarator_id,
          choice(":", "in"),
          field("value", $.expression),
        ),
        ")",
        field("body", $.statement),
      ),

    // Annotations

    _annotation: ($) => choice($.marker_annotation, $.annotation),

    marker_annotation: ($) => seq("@", field("name", $._name)),

    annotation: ($) =>
      seq(
        "@",
        field("name", $._name),
        field("arguments", $.annotation_argument_list),
      ),

    annotation_argument_list: ($) =>
      seq("(", choice($._element_value, commaSep($.element_value_pair)), ")"),

    element_value_pair: ($) =>
      seq(field("key", $.identifier), "=", field("value", $._element_value)),

    _element_value: ($) =>
      prec(
        PREC.ELEMENT_VAL,
        choice($.expression, $.element_value_array_initializer, $._annotation),
      ),

    element_value_array_initializer: ($) =>
      seq("{", commaSep($._element_value), optional(","), "}"),

    // Declarations

    declaration: ($) =>
      prec(
        PREC.DECL,
        choice(
          $.module_declaration,
          $.package_declaration,
          $.import_declaration,
          $.class_declaration,
          $.record_declaration,
          $.interface_declaration,
          $.annotation_type_declaration,
          $.enum_declaration,
          $.variable_declaration,
          $.method_declaration,
        ),
      ),

    module_declaration: ($) =>
      seq(
        repeat($._annotation),
        optional("open"),
        "module",
        field("name", $._name),
        field("body", $.module_body),
      ),

    module_body: ($) => seq("{", repeat($.module_directive), "}"),

    module_directive: ($) =>
      choice(
        $.requires_module_directive,
        $.exports_module_directive,
        $.opens_module_directive,
        $.uses_module_directive,
        $.provides_module_directive,
      ),

    requires_module_directive: ($) =>
      seq(
        "requires",
        repeat(field("modifiers", $.requires_modifier)),
        field("module", $._name),
        ";",
      ),

    requires_modifier: ($) => choice("transitive", "static"),

    exports_module_directive: ($) =>
      seq(
        "exports",
        field("package", $._name),
        optional(
          seq(
            "to",
            field("modules", $._name),
            repeat(seq(",", field("modules", $._name))),
          ),
        ),
        ";",
      ),

    opens_module_directive: ($) =>
      seq(
        "opens",
        field("package", $._name),
        optional(
          seq(
            "to",
            field("modules", $._name),
            repeat(seq(",", field("modules", $._name))),
          ),
        ),
        ";",
      ),

    uses_module_directive: ($) => seq("uses", field("type", $._name), ";"),

    provides_module_directive: ($) =>
      seq(
        "provides",
        field("provided", $._name),
        "with",
        $._name,
        repeat(seq(",", field("provider", $._name))),
        ";",
      ),

    package_declaration: ($) =>
      prec.right(seq(repeat($._annotation), "package", $._name, optional(";"))),

    import_declaration: ($) =>
      prec.right(
        seq(
          "import",
          optional("static"),
          $._name,
          optional(seq(".", $.asterisk)),
          optional(";"),
        ),
      ),

    asterisk: ($) => "*",

    enum_declaration: ($) =>
      seq(
        optional($.modifiers),
        "enum",
        field("name", $.identifier),
        field("interfaces", optional($.super_interfaces)),
        field("body", $.enum_body),
      ),

    enum_body: ($) =>
      seq(
        "{",
        commaSep($.enum_constant),
        optional(","),
        optional($.enum_body_declarations),
        "}",
      ),

    enum_body_declarations: ($) => seq(";", repeat($._class_body_declaration)),

    enum_constant: ($) =>
      seq(
        optional($.modifiers),
        field("name", $.identifier),
        field("arguments", optional($.argument_list)),
        field("body", optional($.class_body)),
      ),

    class_declaration: ($) =>
      prec.right(
        5,
        seq(
          optional($.modifiers),
          "class",
          field("name", $.identifier),
          optional(field("type_parameters", $.type_parameters)),
          optional(field("superclass", $.superclass)),
          optional(field("interfaces", $.super_interfaces)),
          optional(field("permits", $.permits)),
          field("body", $.class_body),
        ),
      ),

    modifiers: ($) =>
      prec(
        5,
        repeat1(
          choice(
            $._annotation,
            "public",
            "protected",
            "private",
            "abstract",
            "static",
            "final",
            "strictfp",
            "default",
            "synchronized",
            "native",
            "transient",
            "volatile",
            "sealed",
            "non-sealed",
          ),
        ),
      ),

    type_parameters: ($) => seq("<", commaSep1($.type_parameter), ">"),

    type_parameter: ($) =>
      seq(
        repeat($._annotation),
        alias($.identifier, $.type_identifier),
        optional($.type_bound),
      ),

    type_bound: ($) => seq("extends", $._type, repeat(seq("&", $._type))),

    superclass: ($) => seq("extends", $._type),

    super_interfaces: ($) => seq("implements", $.type_list),

    type_list: ($) => seq($._type, repeat(seq(",", $._type))),

    permits: ($) => seq("permits", $.type_list),

    class_body: ($) => seq("{", repeat($._class_body_declaration), "}"),

    _class_body_declaration: ($) =>
      choice(
        $.field_declaration,
        $.record_declaration,
        $.method_declaration,
        $.compact_constructor_declaration, // For records.
        $.class_declaration,
        $.interface_declaration,
        $.annotation_type_declaration,
        $.enum_declaration,
        $.block,
        $.static_initializer,
        $.constructor_declaration,
        ";",
      ),

    static_initializer: ($) => seq("static", $.block),

    constructor_declaration: ($) =>
      seq(
        optional($.modifiers),
        $._constructor_declarator,
        optional($.throws),
        field("body", $.constructor_body),
      ),

    _constructor_declarator: ($) =>
      seq(
        field("type_parameters", optional($.type_parameters)),
        field("name", $.identifier),
        field("parameters", $.formal_parameters),
      ),

    constructor_body: ($) =>
      seq(
        "{",
        optional($.explicit_constructor_invocation),
        repeat($.statement),
        "}",
      ),

    explicit_constructor_invocation: ($) =>
      seq(
        choice(
          seq(
            field("type_arguments", optional($.type_arguments)),
            field("constructor", choice($.this, $.super)),
          ),
          seq(
            field("object", choice($.primary_expression)),
            ".",
            field("type_arguments", optional($.type_arguments)),
            field("constructor", $.super),
          ),
        ),
        field("arguments", $.argument_list),
        ";",
      ),

    _name: ($) => choice($.identifier, $.scoped_identifier),

    scoped_identifier: ($) =>
      seq(field("scope", $._name), ".", field("name", $.identifier)),

    field_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          field("type", $._unannotated_type),
          $._variable_declarator_list,
          optional(";"),
        ),
      ),

    record_declaration: ($) =>
      seq(
        optional($.modifiers),
        "record",
        field("name", $.identifier),
        optional(field("type_parameters", $.type_parameters)),
        field("parameters", $.formal_parameters),
        optional(field("interfaces", $.super_interfaces)),
        field("body", $.class_body),
      ),

    annotation_type_declaration: ($) =>
      seq(
        optional($.modifiers),
        "@interface",
        field("name", $.identifier),
        field("body", $.annotation_type_body),
      ),

    annotation_type_body: ($) =>
      seq(
        "{",
        repeat(
          choice(
            $.annotation_type_element_declaration,
            $.constant_declaration,
            $.class_declaration,
            $.interface_declaration,
            $.enum_declaration,
            $.annotation_type_declaration,
          ),
        ),
        "}",
      ),

    annotation_type_element_declaration: ($) =>
      seq(
        optional($.modifiers),
        field("type", $._unannotated_type),
        field("name", $.identifier),
        "(",
        ")",
        field("dimensions", optional($.dimensions)),
        optional($._default_value),
        ";",
      ),

    _default_value: ($) => seq("default", field("value", $._element_value)),

    interface_declaration: ($) =>
      seq(
        optional($.modifiers),
        "interface",
        field("name", $.identifier),
        field("type_parameters", optional($.type_parameters)),
        optional($.extends_interfaces),
        optional(field("permits", $.permits)),
        field("body", $.interface_body),
      ),

    extends_interfaces: ($) => seq("extends", $.type_list),

    interface_body: ($) =>
      seq(
        "{",
        repeat(
          seq(
            optional(/\n+/),
            choice(
              $.constant_declaration,
              $.enum_declaration,
              $.method_declaration,
              $.class_declaration,
              $.interface_declaration,
              $.record_declaration,
              $.annotation_type_declaration,
              ";",
            ),
            optional(/\n+/),
          ),
        ),
        "}",
      ),

    constant_declaration: ($) =>
      seq(
        optional($.modifiers),
        field("type", $._unannotated_type),
        $._variable_declarator_list,
        ";",
      ),

    _variable_declarator_list: ($) =>
      commaSep1(field("declarator", $.variable_declarator)),

    variable_declarator: ($) =>
      prec.right(
        seq(
          $._variable_declarator_id,
          optional(seq("=", field("value", $._variable_initializer))),
        ),
      ),

    _variable_declarator_id: ($) => seq(field("name", $.identifier)),

    _variable_initializer: ($) => choice($.expression, $.array_initializer),

    array_initializer: ($) =>
      seq("{", commaSep($._variable_initializer), optional(","), "}"),

    // Types

    _type: ($) =>
      prec.left(PREC.TYPE, choice($._unannotated_type, $.annotated_type)),

    _unannotated_type: ($) =>
      prec.right(PREC.TYPE, choice($._simple_type, $.array_type)),

    _simple_type: ($) =>
      choice(
        prec(2, $.scoped_type_identifier),
        prec(1, alias($.identifier, $.type_identifier)),
        $.void_type,
        $.integral_type,
        $.floating_point_type,
        $.boolean_type,
        $.generic_type,
      ),

    annotated_type: ($) => seq(repeat1($._annotation), $._unannotated_type),

    scoped_type_identifier: ($) =>
      prec.left(
        PREC.SCOPED_TYPE,
        seq(
          choice(
            alias($.identifier, $.type_identifier),
            $.scoped_type_identifier,
          ),
          ".",
          repeat($._annotation),
          alias($.identifier, $.type_identifier),
        ),
      ),

    generic_type: ($) =>
      prec.right(
        PREC.GENERIC,
        seq(
          choice(
            alias($.identifier, $.type_identifier),
            $.scoped_type_identifier,
          ),
          $.type_arguments,
        ),
      ),

    array_type: ($) =>
      seq(
        field("element", $._unannotated_type),
        field("dimensions", $.dimensions),
      ),

    integral_type: () => choice("byte", "short", "int", "long", "char"),

    floating_point_type: () => choice("float", "double"),

    boolean_type: () => "boolean",

    void_type: () => "void",

    _method_header: ($) =>
      seq(
        optional(
          seq(
            field("type_parameters", $.type_parameters),
            repeat($._annotation),
          ),
        ),
        field("type", $._unannotated_type),
        $._method_declarator,
        optional($.throws),
      ),

    _method_declarator: ($) =>
      prec.right(
        seq(
          field("name", $.identifier),
          field("parameters", $.formal_parameters),
          field("dimensions", optional($.dimensions)),
        ),
      ),

    formal_parameters: ($) =>
      seq(
        "(",
        optional($.receiver_parameter),
        commaSep(choice($.formal_parameter, $.spread_parameter)),
        ")",
      ),

    formal_parameter: ($) =>
      seq(
        optional($.modifiers),
        field("type", $._unannotated_type),
        $._variable_declarator_id,
      ),

    receiver_parameter: ($) =>
      seq(
        repeat($._annotation),
        $._unannotated_type,
        optional(seq($.identifier, ".")),
        $.this,
      ),

    spread_parameter: ($) =>
      seq(
        optional($.modifiers),
        field("type", $._unannotated_type),
        "...",
        $.variable_declarator,
      ),

    throws: ($) => seq("throws", commaSep1($._type)),

    variable_declaration: ($) =>
      prec.right(
        PREC.DECL,
        seq(
          optional("final"),
          // repeat($._annotation),
          choice("def", "var", field("type", $._unannotated_type)),
          $._variable_declarator_list,
          optional(";"),
        ),
      ),

    method_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          $._method_header,
          optional(field("body", $.block)),
          optional(";"),
        ),
      ),

    compact_constructor_declaration: ($) =>
      seq(
        optional($.modifiers),
        field("name", $.identifier),
        field("body", $.block),
      ),

    this: () => "this",

    super: () => "super",

    // https://docs.oracle.com/javase/specs/jls/se8/html/jls-3.html#jls-IdentifierChars
    identifier: () => /[\p{L}_$][\p{L}\p{Nd}_$]*/,

    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: ($) =>
      choice($.line_comment, $.block_comment, $.groovydoc_comment),

    line_comment: () => token(prec(PREC.COMMENT, seq("//", /[^\n]*/))),

    block_comment: () =>
      token(prec(PREC.COMMENT, seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"))),

    groovydoc_comment: () =>
      token(prec(PREC.COMMENT + 1, seq("/**", /([^*]|\*[^/])*/, "*/"))),
  },
});

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
