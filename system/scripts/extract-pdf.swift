import Foundation
import PDFKit

guard CommandLine.arguments.count > 1 else {
    fputs("Usage: swift extract-pdf.swift file.pdf\n", stderr)
    exit(1)
}

let file = CommandLine.arguments[1]
let url = URL(fileURLWithPath: file)

guard let document = PDFDocument(url: url) else {
    fputs("Cannot open PDF\n", stderr)
    exit(1)
}

let pages = min(document.pageCount, 3)

for index in 0..<pages {
    if let page = document.page(at: index),
       let text = page.string {
        print(text)
    }
}
