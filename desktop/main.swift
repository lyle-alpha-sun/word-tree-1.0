import Cocoa
import WebKit
import UniformTypeIdentifiers

// Serve the bundled site through WebKit itself: no web server or external runtime.
final class BundledSite: NSObject, WKURLSchemeHandler {
    let root: URL
    init(root: URL) { self.root = root.resolvingSymlinksInPath() }
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url, url.host == "app",
              task.request.httpMethod == nil || task.request.httpMethod == "GET" else {
            task.didFailWithError(NSError(domain: NSURLErrorDomain, code: NSURLErrorUnsupportedURL)); return
        }
        let path = url.path.isEmpty || url.path == "/" ? "index.html" : String(url.path.dropFirst())
        let file = root.appendingPathComponent(path).standardizedFileURL.resolvingSymlinksInPath()
        guard file.path.hasPrefix(root.path + "/") else {
            task.didFailWithError(NSError(domain: NSURLErrorDomain, code: NSURLErrorNoPermissionsToReadFile)); return
        }
        do {
            let data = try Data(contentsOf: file, options: .mappedIfSafe)
            let types = ["html":"text/html", "js":"application/javascript", "css":"text/css", "json":"application/json", "svg":"image/svg+xml", "png":"image/png", "jpg":"image/jpeg", "woff2":"font/woff2"]
            let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: [
                "Content-Type": (types[file.pathExtension] ?? "application/octet-stream") + (["html","js","css","json","svg"].contains(file.pathExtension) ? "; charset=utf-8" : ""),
                "Content-Length": String(data.count), "Access-Control-Allow-Origin":"*", "Cache-Control":"no-cache"
            ])!
            task.didReceive(response); task.didReceive(data); task.didFinish()
        } catch { task.didFailWithError(error) }
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    var window: NSWindow!
    var web: WKWebView!
    var saved: [String:String] = [:]
    let stateURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("WordTree/state.json")

    func applicationDidFinishLaunching(_ notification: Notification) {
        do {
            if FileManager.default.fileExists(atPath: stateURL.path) {
                saved = try JSONDecoder().decode([String:String].self, from: Data(contentsOf: stateURL))
            }
            try FileManager.default.createDirectory(at: stateURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        } catch {
            let alert = NSAlert(); alert.messageText = "无法读取学习记录"
            alert.informativeText = "原文件未改动：\(stateURL.path)\n\(error.localizedDescription)"
            alert.runModal(); NSApp.terminate(nil); return
        }
        buildMenu()
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundledSite(root: Bundle.main.resourceURL!.appendingPathComponent("site")), forURLScheme: "wordtree")
        let controller = config.userContentController
        controller.add(self, name: "storage")
        controller.add(self, name: "saveFile")
        let seed = String(data: (try? JSONSerialization.data(withJSONObject: saved, options: [.sortedKeys])) ?? Data("{}".utf8), encoding: .utf8)!
        // A fixed native store avoids WebKit custom-origin storage differences across OS updates.
        let bridge = """
        (() => {
          const data = \(seed);
          const sync = () => window.webkit.messageHandlers.storage.postMessage({...data});
          const storage = {
            getItem(k){k=String(k);return Object.prototype.hasOwnProperty.call(data,k)?data[k]:null},
            setItem(k,v){data[String(k)]=String(v);sync()},
            removeItem(k){delete data[String(k)];sync()},
            clear(){Object.keys(data).forEach(k=>delete data[k]);sync()},
            key(i){return Object.keys(data)[i]??null},
            get length(){return Object.keys(data).length}
          };
          Object.defineProperty(window,'localStorage',{value:storage,configurable:false});
          Object.defineProperty(window,'wordTreeDesktop',{value:Object.freeze({
            saveJSON(filename,contents){window.webkit.messageHandlers.saveFile.postMessage({filename,contents})}
          })});
        })();
        """
        controller.addUserScript(WKUserScript(source: bridge, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self; web.uiDelegate = self
        if #available(macOS 13.3, *) { web.isInspectable = true }
        web.setValue(false, forKey: "drawsBackground")
        let visible = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: min(1440, visible.width-60), height: min(900, visible.height-60)),
                          styleMask: [.titled,.closable,.miniaturizable,.resizable], backing: .buffered, defer: false)
        window.title = "单词树"
        window.minSize = NSSize(width: 900, height: 650)
        window.backgroundColor = NSColor(calibratedRed: 0.96, green: 0.97, blue: 0.99, alpha: 1)
        window.contentView = web
        window.isReleasedWhenClosed = false
        if !window.setFrameUsingName("WordTreeMain") { window.center() }
        window.setFrameAutosaveName("WordTreeMain")
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        web.load(URLRequest(url: URL(string: "wordtree://app/index.html")!))
    }

    func buildMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem(); let appMenu = NSMenu(); appItem.submenu = appMenu
        appMenu.addItem(withTitle: "关于单词树", action: #selector(about), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "隐藏单词树", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "退出单词树", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        main.addItem(appItem)
        let editItem = NSMenuItem(); let edit = NSMenu(title: "编辑"); editItem.submenu = edit
        for (title, action, key) in [("撤销","undo:","z"),("剪切","cut:","x"),("复制","copy:","c"),("粘贴","paste:","v"),("全选","selectAll:","a")] {
            edit.addItem(withTitle: title, action: Selector(action), keyEquivalent: key)
        }
        main.addItem(editItem)
        let viewItem = NSMenuItem(); let view = NSMenu(title: "视图"); viewItem.submenu = view
        view.addItem(withTitle: "搜索单词", action: #selector(focusSearch), keyEquivalent: "f")
        view.addItem(withTitle: "重新载入", action: #selector(reload), keyEquivalent: "r")
        view.addItem(withTitle: "进入全屏", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "")
        main.addItem(viewItem)
        let windowItem = NSMenuItem(); let windows = NSMenu(title: "窗口"); windowItem.submenu = windows
        windows.addItem(withTitle: "最小化", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        main.addItem(windowItem); NSApp.windowsMenu = windows
        NSApp.mainMenu = main
    }
    @objc func about() {
        NSApp.orderFrontStandardAboutPanel(options: [.applicationName:"单词树", .applicationVersion:"1.0", .credits:NSAttributedString(string:"词族导图 · 本地词库 · 离线学习\n网站和词库来源见随附 THIRD_PARTY_NOTICES.md")])
    }
    @objc func focusSearch() { web.evaluateJavaScript("document.querySelector('[aria-label=\"搜索单词\"]')?.focus()") }
    @objc func reload() { web.reload() }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        window?.makeKeyAndOrderFront(nil); return true
    }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.scheme == "wordtree", message.frameInfo.request.url?.host == "app" else { return }
        if message.name == "storage", let all = message.body as? [String:String] {
            let values = all.filter { $0.key.hasPrefix("wt.") }
            guard values != saved else { return }
            do {
                let data = try JSONEncoder().encode(values)
                if FileManager.default.fileExists(atPath: stateURL.path) {
                    let previous = stateURL.deletingLastPathComponent().appendingPathComponent("state.previous.json")
                    let old = try Data(contentsOf: stateURL)
                    try old.write(to: previous, options: .atomic)
                }
                try data.write(to: stateURL, options: .atomic)
                saved = values
            } catch { showError("学习记录未能保存", error) }
        } else if message.name == "saveFile", let value = message.body as? [String:String],
                  let filename = value["filename"], let contents = value["contents"], contents.utf8.count < 2_000_000 {
            let panel = NSSavePanel(); panel.allowedContentTypes = [.json]
            panel.nameFieldStringValue = (filename as NSString).lastPathComponent
            panel.title = "导出学习进度"
            panel.beginSheetModal(for: window) { response in
                if response == .OK, let url = panel.url {
                    do {try contents.write(to: url, atomically: true, encoding: .utf8)}
                    catch {self.showError("导出失败", error)}
                }
            }
        }
    }
    func showError(_ title: String, _ error: Error) {
        let alert = NSAlert(); alert.messageText = title; alert.informativeText = error.localizedDescription
        alert.beginSheetModal(for: window)
    }
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel(); panel.allowedContentTypes = [.json]
        panel.allowsMultipleSelection = false; panel.canChooseDirectories = false
        panel.title = "导入学习进度"
        panel.beginSheetModal(for: window) { response in completionHandler(response == .OK ? panel.urls : nil) }
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if url.scheme == "wordtree" && url.host == "app" { decisionHandler(.allow); return }
        if ["https","http"].contains(url.scheme ?? "") { NSWorkspace.shared.open(url) }
        decisionHandler(.cancel)
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url, ["https","http"].contains(url.scheme ?? "") { NSWorkspace.shared.open(url) }; return nil
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { showError("页面载入失败", error) }
}

let application = NSApplication.shared
let delegate = AppDelegate()
application.setActivationPolicy(.regular)
application.delegate = delegate
application.run()
