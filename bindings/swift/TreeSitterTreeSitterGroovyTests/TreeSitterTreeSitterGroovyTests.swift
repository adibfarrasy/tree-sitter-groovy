import XCTest
import SwiftTreeSitter
import TreeSitterTreeSitterGroovy

final class TreeSitterTreeSitterGroovyTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_tree_sitter_groovy())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading tree-sitter groovy grammar")
    }
}
