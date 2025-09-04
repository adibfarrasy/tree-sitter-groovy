#include <tree_sitter/parser.h>
#include <wctype.h>
#include <stdio.h>
#include <string.h>

enum TokenType {
  AUTOMATIC_SEMICOLON,
  RANGE_OPERATOR,
  RECORD_KEYWORD,
};

static void advance(TSLexer *lexer) {
  lexer->advance(lexer, false);
}

static void skip(TSLexer *lexer) {
  lexer->advance(lexer, true);
}

static bool is_newline(int32_t c) {
  return c == '\n' || c == '\r';
}

static bool scan_whitespace_and_comments(TSLexer *lexer) {
  bool found_newline = false;
  
  for (;;) {
    while (iswspace(lexer->lookahead)) {
      if (is_newline(lexer->lookahead)) {
        found_newline = true;
      }
      skip(lexer);
    }
    
    // Skip line comments
    if (lexer->lookahead == '/' && lexer->eof(lexer) == false) {
      skip(lexer);
      if (lexer->lookahead == '/') {
        skip(lexer);
        while (lexer->lookahead != '\n' && !lexer->eof(lexer)) {
          skip(lexer);
        }
        if (lexer->lookahead == '\n') {
          found_newline = true;
          skip(lexer);
        }
      } else {
        return found_newline;
      }
    } else {
      return found_newline;
    }
  }
}

static bool scan_record_keyword(TSLexer *lexer) {
  // Quick check to avoid unnecessary work
  if (lexer->lookahead != 'r') {
    return false;
  }
  
  // Check if we're looking at "record" without consuming
  // We need to be in a context where "record" is expected as a keyword
  // This is only valid when preceded by modifiers or at the start
  
  lexer->result_symbol = RECORD_KEYWORD;
  
  // Check if we're looking at "record"
  const char *word = "record";
  for (int i = 0; i < 6; i++) {
    if (lexer->lookahead != word[i]) {
      return false;
    }
    advance(lexer);
  }
  
  // Must be followed by whitespace
  if (!iswspace(lexer->lookahead)) {
    return false;
  }
  
  lexer->mark_end(lexer);
  
  // Skip whitespace to check what follows
  while (iswspace(lexer->lookahead)) {
    skip(lexer);
  }
  
  // Check if followed by identifier (likely record name)
  if (iswalpha(lexer->lookahead) || lexer->lookahead == '_' || lexer->lookahead == '$') {
    return true;
  }
  
  return false;
}

static bool scan_range_operator(TSLexer *lexer) {
  lexer->result_symbol = RANGE_OPERATOR;
  
  // This scanner is called to resolve tokenization conflicts with floating point literals
  // We need to recognize '..' patterns that would otherwise be tokenized as separate literals
  if (lexer->lookahead == '.') {
    advance(lexer);
    
    // Skip whitespace between dots
    while (iswspace(lexer->lookahead)) {
      skip(lexer);
    }
    
    if (lexer->lookahead == '.') {
      advance(lexer);
      lexer->mark_end(lexer);
      return true;
    }
  }
  
  return false;
}


static bool scan_automatic_semicolon(TSLexer *lexer) {
  lexer->result_symbol = AUTOMATIC_SEMICOLON;
  lexer->mark_end(lexer);
  
  // First check if there's an actual semicolon
  if (lexer->lookahead == ';') {
    advance(lexer);
    lexer->mark_end(lexer);
    return true;
  }
  
  bool found_newline = scan_whitespace_and_comments(lexer);
  
  // Only insert automatic semicolon if we found a newline
  if (!found_newline) {
    return false;
  }
  
  // Check what comes after the newline
  switch (lexer->lookahead) {
    // Insert semicolon before annotations
    case '@':
      return true;
      
    // Insert semicolon before closing braces
    case '}':
      return true;
      
    // Insert semicolon at EOF
    case '\0':
      return true;
      
    // Insert semicolon before common type keywords and modifiers
    case 'p': // public, private, protected
    case 's': // static
    case 'f': // final
    case 'a': // abstract
    case 'v': // void
    case 'i': // int, interface
    case 'c': // class
    case 'd': // def, double
    case 'b': // boolean, byte
    case 'l': // long
    case 'S': // String
    case 'L': // Long
    case 'I': // Integer
    case 'B': // Boolean, Byte
    case 'D': // Double
    case 'F': // Float
      return true;
      
    // Check for uppercase letters (likely type names)
    default:
      if (iswupper(lexer->lookahead)) {
        return true;
      }
      return false;
  }
}

void *tree_sitter_groovy_external_scanner_create() { 
  return NULL; 
}

void tree_sitter_groovy_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_groovy_external_scanner_serialize(void *payload, char *buffer) {
  return 0;
}

void tree_sitter_groovy_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

bool tree_sitter_groovy_external_scanner_scan(
  void *payload,
  TSLexer *lexer,
  const bool *valid_symbols
) {
  // Try range operator first - it has higher priority to resolve tokenization conflicts
  if (valid_symbols[RANGE_OPERATOR]) {
    return scan_range_operator(lexer);
  }
  
  // Try automatic semicolon before record keyword
  // This is important for interface methods with annotations
  if (valid_symbols[AUTOMATIC_SEMICOLON]) {
    return scan_automatic_semicolon(lexer);
  }
  
  // Try record keyword last - only after checking for semicolons
  if (valid_symbols[RECORD_KEYWORD]) {
    return scan_record_keyword(lexer);
  }
  
  return false;
}