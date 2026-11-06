import Cocoa
let directory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
for points in [16,32,128,256,512] {
    for scale in [1,2] {
        let pixels = points * scale
        let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        NSGraphicsContext.saveGraphicsState()
        let context = NSGraphicsContext(bitmapImageRep: bitmap)!
        NSGraphicsContext.current = context
        context.cgContext.scaleBy(x: CGFloat(pixels)/1024, y: CGFloat(pixels)/1024)
        NSColor(calibratedRed: 0.13, green: 0.21, blue: 0.35, alpha: 1).setFill()
        NSBezierPath(roundedRect: NSRect(x: 74, y: 74, width: 876, height: 876), xRadius: 196, yRadius: 196).fill()
        let word = "w." as NSString
        let attributes: [NSAttributedString.Key:Any] = [.font:NSFont.systemFont(ofSize: 624, weight: .black), .foregroundColor:NSColor.white]
        let size = word.size(withAttributes: attributes)
        word.draw(at: NSPoint(x: (1024-size.width)/2, y: (1024-size.height)/2+32), withAttributes: attributes)
        NSGraphicsContext.restoreGraphicsState()
        let suffix = scale == 2 ? "@2x" : ""
        let path = directory.appendingPathComponent("icon_\(points)x\(points)\(suffix).png")
        try bitmap.representation(using: .png, properties: [:])!.write(to: path)
    }
}
